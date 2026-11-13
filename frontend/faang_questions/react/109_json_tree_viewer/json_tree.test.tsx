/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ancestorsOf, flattenJson, JsonTree, JsonValue, PAGE_SIZE, Row, searchPaths } from './json_tree';

const CONFIG: JsonValue = {
  service: 'ingest-router',
  version: 3,
  enabled: true,
  owner: null,
  regions: ['eu-west-1', 'us-east-1'],
  limits: { maxBitrateKbps: 12000, retries: 3, tags: {} },
};

const bigArray = (n: number): JsonValue => Array.from({ length: n }, (_, i) => ({ id: i }));

const items = () => screen.getAllByRole('treeitem');
const item = (name: RegExp) => screen.getByRole('treeitem', { name });
const tabbable = () => items().filter((li) => li.getAttribute('tabindex') === '0');
const focusedText = () => document.activeElement?.textContent ?? '';
/** Programmatic focus runs the row's onFocus state update, so wrap it in act. */
const focusItem = (name: RegExp) => act(() => item(name).focus());

describe('109 json tree — flattenJson', () => {
  it('a collapsed root is exactly one row describing the container', () => {
    expect(flattenJson(CONFIG, { expanded: new Set() })).toEqual<Row[]>([
      { path: '', key: 'root', type: 'object', preview: '{6 keys}', depth: 0, expandable: true, childCount: 6 },
    ]);
  });

  it('an expanded root emits its children in key order with type, preview and depth', () => {
    const rows = flattenJson(CONFIG, { expanded: new Set(['']) });
    expect(rows.map((r) => r.path)).toEqual(['', 'service', 'version', 'enabled', 'owner', 'regions', 'limits']);
    expect(rows.slice(1).map((r) => [r.key, r.type, r.preview, r.depth, r.expandable, r.childCount])).toEqual([
      ['service', 'string', '"ingest-router"', 1, false, 0],
      ['version', 'number', '3', 1, false, 0],
      ['enabled', 'boolean', 'true', 1, false, 0],
      ['owner', 'null', 'null', 1, false, 0],
      ['regions', 'array', '[2 items]', 1, true, 2],
      ['limits', 'object', '{3 keys}', 1, true, 3],
    ]);
  });

  it('emits only the children of expanded paths; a collapsed parent hides its expanded descendants', () => {
    const rows = flattenJson(CONFIG, { expanded: new Set(['', 'limits']) });
    expect(rows.map((r) => r.path)).toEqual([
      '',
      'service',
      'version',
      'enabled',
      'owner',
      'regions',
      'limits',
      'limits/maxBitrateKbps',
      'limits/retries',
      'limits/tags',
    ]);
    const tags = rows.find((r) => r.path === 'limits/tags')!;
    expect(tags).toMatchObject({ depth: 2, preview: '{}', expandable: false, childCount: 0 });

    expect(flattenJson(CONFIG, { expanded: new Set(['limits']) })).toHaveLength(1);
  });

  it('array children use the index as key and path segment', () => {
    const rows = flattenJson(CONFIG, { expanded: new Set(['', 'regions']) });
    expect(rows.filter((r) => r.path.startsWith('regions/'))).toEqual<Row[]>([
      { path: 'regions/0', key: '0', type: 'string', preview: '"eu-west-1"', depth: 2, expandable: false, childCount: 0 },
      { path: 'regions/1', key: '1', type: 'string', preview: '"us-east-1"', depth: 2, expandable: false, childCount: 0 },
    ]);
  });

  it('senior: a collapsed 100k array costs one row; expanded it is paged with a "more" row', () => {
    const big = bigArray(100_000);
    expect(flattenJson(big, { expanded: new Set() })).toEqual<Row[]>([
      { path: '', key: 'root', type: 'array', preview: '[100000 items]', depth: 0, expandable: true, childCount: 100_000 },
    ]);

    const paged = flattenJson(big, { expanded: new Set(['']) });
    expect(paged).toHaveLength(1 + PAGE_SIZE + 1);
    expect(paged[1]).toMatchObject({ path: '0', key: '0', type: 'object', preview: '{1 key}' });
    expect(paged[PAGE_SIZE]).toMatchObject({ path: '99' });
    expect(paged.at(-1)).toMatchObject({ type: 'more', preview: 'Show 100 more', depth: 1, childCount: 99_900 });

    const more = flattenJson(big, { expanded: new Set(['']), shown: new Map([['', 300]]) });
    expect(more).toHaveLength(1 + 300 + 1);
  });

  it('senior: the last page shows the remainder and a fully shown list has no "more" row', () => {
    const arr = bigArray(250);
    const page2 = flattenJson(arr, { expanded: new Set(['']), shown: new Map([['', 200]]) });
    expect(page2).toHaveLength(1 + 200 + 1);
    expect(page2.at(-1)).toMatchObject({ type: 'more', preview: 'Show 50 more', childCount: 50 });
    const all = flattenJson(arr, { expanded: new Set(['']), shown: new Map([['', 250]]) });
    expect(all).toHaveLength(251);
    expect(all.some((r) => r.type === 'more')).toBe(false);
  });

  it('senior: the root may be a primitive or an array', () => {
    expect(flattenJson(42, { expanded: new Set(['']) })).toEqual<Row[]>([
      { path: '', key: 'root', type: 'number', preview: '42', depth: 0, expandable: false, childCount: 0 },
    ]);
    expect(flattenJson('hi', { expanded: new Set() })[0]).toMatchObject({ type: 'string', preview: '"hi"' });
    expect(flattenJson(null, { expanded: new Set() })[0]).toMatchObject({ type: 'null', preview: 'null' });
    expect(flattenJson([1, 2], { expanded: new Set(['']) }).map((r) => r.path)).toEqual(['', '0', '1']);
  });
});

describe('109 json tree — searchPaths / ancestorsOf', () => {
  it('matches keys case-insensitively', () => {
    expect(searchPaths(CONFIG, 'BITRATE')).toEqual(['limits/maxBitrateKbps']);
    expect(searchPaths(CONFIG, 'retries')).toEqual(['limits/retries']);
  });

  it('matches primitive values of every type, not container previews', () => {
    expect(searchPaths(CONFIG, 'us-east')).toEqual(['regions/1']);
    expect(searchPaths(CONFIG, '12000')).toEqual(['limits/maxBitrateKbps']);
    expect(searchPaths(CONFIG, 'true')).toEqual(['enabled']);
    expect(searchPaths(CONFIG, 'null')).toEqual(['owner']);
    expect(searchPaths(CONFIG, 'keys')).toEqual([]);
    expect(searchPaths(CONFIG, 'items')).toEqual([]);
  });

  it('returns results in document order, [] for an empty or whitespace query, [] when nothing matches', () => {
    expect(searchPaths(CONFIG, 'es')).toEqual(['service', 'regions/0', 'limits/retries']);
    expect(searchPaths(CONFIG, '')).toEqual([]);
    expect(searchPaths(CONFIG, '   ')).toEqual([]);
    expect(searchPaths(CONFIG, 'zzz')).toEqual([]);
  });

  it('a primitive root can match by value', () => {
    expect(searchPaths(42, '4')).toEqual(['']);
  });

  it('ancestorsOf lists every path that must be expanded to reveal a row', () => {
    expect(ancestorsOf('a/0/b')).toEqual(['', 'a', 'a/0']);
    expect(ancestorsOf('a')).toEqual(['']);
    expect(ancestorsOf('')).toEqual([]);
  });
});

describe('109 json tree — rendering', () => {
  it('renders a tree named JSON with one treeitem per row, aria-level and aria-expanded', () => {
    render(<JsonTree value={CONFIG} />);
    const tree = screen.getByRole('tree', { name: 'JSON' });
    const rows = within(tree).getAllByRole('treeitem');
    expect(rows).toHaveLength(7);
    expect(rows[0]).toHaveAttribute('aria-level', '1');
    expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
    expect(rows[1]).toHaveAttribute('aria-level', '2');
    expect(rows[1]).not.toHaveAttribute('aria-expanded');
    expect(item(/regions/)).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows key, type badge and preview on each row', () => {
    render(<JsonTree value={CONFIG} />);
    const row = item(/service/);
    expect(row).toHaveTextContent('service');
    expect(row).toHaveTextContent('string');
    expect(row).toHaveTextContent('"ingest-router"');
    expect(item(/limits/)).toHaveTextContent('{3 keys}');
    expect(item(/regions/)).toHaveTextContent('[2 items]');
    expect(item(/owner/)).toHaveTextContent('null');
  });

  it('defaultExpandedDepth controls the initial expansion', () => {
    const { unmount } = render(<JsonTree value={CONFIG} defaultExpandedDepth={0} />);
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveAttribute('aria-expanded', 'false');
    unmount();
    render(<JsonTree value={CONFIG} defaultExpandedDepth={2} />);
    expect(items()).toHaveLength(12);
    expect(item(/maxBitrateKbps/)).toHaveAttribute('aria-level', '3');
  });

  it('senior: a primitive root renders a single non-expandable row', () => {
    render(<JsonTree value={42} />);
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveTextContent('root');
    expect(items()[0]).toHaveTextContent('number');
    expect(items()[0]).toHaveTextContent('42');
    expect(items()[0]).not.toHaveAttribute('aria-expanded');
  });
});

describe('109 json tree — expand and collapse', () => {
  it('click toggles a container row', async () => {
    const user = userEvent.setup();
    render(<JsonTree value={CONFIG} />);
    await user.click(item(/regions/));
    expect(item(/regions/)).toHaveAttribute('aria-expanded', 'true');
    expect(item(/eu-west-1/)).toHaveAttribute('aria-level', '3');
    expect(items()).toHaveLength(9);
    await user.click(item(/regions/));
    expect(items()).toHaveLength(7);
    expect(screen.queryByRole('treeitem', { name: /eu-west-1/ })).not.toBeInTheDocument();
  });

  it('Enter and ArrowRight expand, ArrowLeft collapses, ArrowLeft on a leaf focuses the parent', async () => {
    const user = userEvent.setup();
    render(<JsonTree value={CONFIG} />);
    focusItem(/limits/);
    await user.keyboard('{Enter}');
    expect(item(/limits/)).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(item(/limits/)).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{ArrowRight}');
    expect(item(/limits/)).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    expect(focusedText()).toContain('maxBitrateKbps');
    await user.keyboard('{ArrowLeft}');
    expect(focusedText()).toContain('limits');
    expect(item(/limits/)).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('109 json tree — roving focus', () => {
  it('exactly one row is tabbable and ArrowDown / ArrowUp move focus with it', async () => {
    const user = userEvent.setup();
    render(<JsonTree value={CONFIG} />);
    expect(tabbable()).toHaveLength(1);
    expect(tabbable()[0]).toHaveTextContent('root');
    await user.tab();
    await user.tab();
    expect(focusedText()).toContain('root');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(focusedText()).toContain('version');
    expect(tabbable()).toHaveLength(1);
    expect(tabbable()[0]).toHaveTextContent('version');
    await user.keyboard('{ArrowUp}');
    expect(focusedText()).toContain('service');
    await user.keyboard('{End}');
    expect(focusedText()).toContain('limits');
    await user.keyboard('{Home}');
    expect(focusedText()).toContain('root');
  });

  it('collapsing the parent of the focused row keeps a valid tab stop', async () => {
    const user = userEvent.setup();
    render(<JsonTree value={CONFIG} defaultExpandedDepth={2} />);
    focusItem(/retries/);
    await user.keyboard('{ArrowLeft}');
    expect(focusedText()).toContain('limits');
    await user.keyboard('{ArrowLeft}');
    expect(items()).toHaveLength(9);
    expect(tabbable()).toHaveLength(1);
    expect(tabbable()[0]).toHaveTextContent('limits');
  });
});

describe('109 json tree — search', () => {
  it('expands the ancestors of matches, marks matching rows and announces the count', async () => {
    const user = userEvent.setup();
    render(<JsonTree value={CONFIG} />);
    await user.type(screen.getByLabelText('Search'), 'es');
    expect(screen.getByRole('status')).toHaveTextContent('3 matches');
    expect(item(/regions/)).toHaveAttribute('aria-expanded', 'true');
    expect(item(/limits/)).toHaveAttribute('aria-expanded', 'true');
    expect(item(/service/)).toHaveAttribute('data-match');
    expect(item(/eu-west-1/)).toHaveAttribute('data-match');
    expect(item(/retries/)).toHaveAttribute('data-match');
    expect(item(/version/)).not.toHaveAttribute('data-match');
    expect(item(/limits/)).not.toHaveAttribute('data-match');
    expect(item(/us-east-1/)).not.toHaveAttribute('data-match');
  });

  it('reports 0 matches, 1 match, and clears the status when the query is emptied', async () => {
    const user = userEvent.setup();
    render(<JsonTree value={CONFIG} />);
    const input = screen.getByLabelText('Search');
    await user.type(input, 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('0 matches');
    expect(screen.getByRole('tree').querySelectorAll('[data-match]')).toHaveLength(0);
    await user.clear(input);
    await user.type(input, 'bitrate');
    expect(screen.getByRole('status')).toHaveTextContent('1 match');
    expect(item(/maxBitrateKbps/)).toHaveAttribute('data-match');
    await user.clear(input);
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(item(/limits/)).toHaveAttribute('aria-expanded', 'true'); // stays revealed
  });
});

describe('109 json tree — copy path', () => {
  it('the Copy path button writes the row path to the clipboard without toggling the row', async () => {
    const user = userEvent.setup();
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<JsonTree value={CONFIG} defaultExpandedDepth={2} />);
    await user.click(within(item(/limits/)).getByRole('button', { name: 'Copy path' }));
    expect(writeText).toHaveBeenCalledWith('limits');
    expect(item(/limits/)).toHaveAttribute('aria-expanded', 'true');
    await user.click(within(item(/maxBitrateKbps/)).getByRole('button', { name: 'Copy path' }));
    expect(writeText).toHaveBeenLastCalledWith('limits/maxBitrateKbps');
    await user.click(within(items()[0]).getByRole('button', { name: 'Copy path' }));
    expect(writeText).toHaveBeenLastCalledWith('');
  });

  it('pressing c on a focused row copies its path (buttons are not tab stops)', async () => {
    const user = userEvent.setup();
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<JsonTree value={CONFIG} />);
    focusItem(/regions/);
    await user.keyboard('c');
    expect(writeText).toHaveBeenCalledWith('regions');
    expect(screen.getAllByRole('button', { name: 'Copy path' }).every((b) => b.tabIndex === -1)).toBe(true);
  });
});

describe('109 json tree — large arrays', () => {
  it('senior: renders the first 100 children and a Show 100 more row; each click reveals a page', async () => {
    const user = userEvent.setup();
    render(<JsonTree value={bigArray(250)} />);
    expect(items()).toHaveLength(1 + PAGE_SIZE + 1);
    expect(screen.getByRole('treeitem', { name: /^99 / })).toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: /^100 / })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show 100 more' }));
    expect(items()).toHaveLength(1 + 200 + 1);
    expect(screen.getByRole('treeitem', { name: /^100 / })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show 50 more' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show 50 more' }));
    expect(items()).toHaveLength(251);
    expect(screen.queryByRole('button', { name: /Show \d+ more/ })).not.toBeInTheDocument();
  });

  it('senior: the more row is reachable by keyboard and Enter reveals the next page', async () => {
    const user = userEvent.setup();
    render(<JsonTree value={{ segments: bigArray(150) }} />);
    expect(items()).toHaveLength(2);
    focusItem(/segments/);
    await user.keyboard('{ArrowRight}');
    expect(items()).toHaveLength(2 + PAGE_SIZE + 1);
    await user.keyboard('{End}');
    expect(focusedText()).toBe('Show 50 more');
    await user.keyboard('{Enter}');
    expect(items()).toHaveLength(2 + 150);
  });

  it('senior: a collapsed 100k-element root renders a single row', () => {
    render(<JsonTree value={bigArray(100_000)} defaultExpandedDepth={0} />);
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveTextContent('[100000 items]');
  });
});
