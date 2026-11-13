/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { FileTree, folderState, leafIds, type TreeNode } from './file_tree';

const NODES: TreeNode[] = [
  {
    id: 'media',
    name: 'Media',
    children: [
      {
        id: 'promos',
        name: 'Promos',
        children: [
          { id: 'promo_a', name: 'promo_a.mp4' },
          { id: 'promo_b', name: 'promo_b.mp4' },
        ],
      },
      {
        id: 'trailers',
        name: 'Trailers',
        children: [{ id: 'trailer_1', name: 'trailer_1.mov' }],
      },
    ],
  },
  {
    id: 'playlists',
    name: 'Playlists',
    children: [{ id: 'autumn', name: 'autumn.json' }],
  },
  { id: 'readme', name: 'readme.txt' },
];

const ALL_EXPANDED = ['media', 'promos', 'trailers', 'playlists'];

function Tree({
  initial = [],
  defaultExpanded = ALL_EXPANDED,
  spy,
}: {
  initial?: string[];
  defaultExpanded?: string[];
  spy?: (next: Set<string>) => void;
}) {
  const [value, setValue] = useState(() => new Set(initial));
  return (
    <FileTree
      nodes={NODES}
      value={value}
      defaultExpanded={defaultExpanded}
      onChange={(next) => {
        spy?.(next);
        setValue(next);
      }}
    />
  );
}

const item = (name: string) => screen.getByRole('treeitem', { name });
const queryItem = (name: string) => screen.queryByRole('treeitem', { name });
const checkbox = (name: string) => screen.getByRole('checkbox', { name });
const visibleItemNames = () =>
  screen.getAllByRole('treeitem').map((el) => el.getAttribute('aria-labelledby')).map((id) => {
    const label = document.getElementById(id as string);
    return label?.textContent ?? '';
  });

describe('pure: leafIds', () => {
  it('returns every leaf id under a folder in document order', () => {
    expect(leafIds(NODES[0])).toEqual(['promo_a', 'promo_b', 'trailer_1']);
  });

  it('returns a leaf itself and [] for an empty folder', () => {
    expect(leafIds({ id: 'x', name: 'x.txt' })).toEqual(['x']);
    expect(leafIds({ id: 'empty', name: 'Empty', children: [] })).toEqual([]);
  });
});

describe('pure: folderState', () => {
  it('reports none / some / all for a folder', () => {
    const media = NODES[0];
    expect(folderState(media, new Set())).toBe('none');
    expect(folderState(media, new Set(['promo_a']))).toBe('some');
    expect(folderState(media, new Set(['promo_a', 'promo_b']))).toBe('some');
    expect(folderState(media, new Set(['promo_a', 'promo_b', 'trailer_1']))).toBe('all');
  });

  it('is none for an empty folder and all / none for a leaf', () => {
    expect(folderState({ id: 'e', name: 'Empty', children: [] }, new Set(['e']))).toBe('none');
    expect(folderState({ id: 'r', name: 'r.txt' }, new Set(['r']))).toBe('all');
    expect(folderState({ id: 'r', name: 'r.txt' }, new Set())).toBe('none');
  });
});

describe('1. roles and structure', () => {
  it('renders a tree named Files with levelled treeitems; aria-expanded only on folders', () => {
    render(<Tree />);
    expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument();
    expect(item('Media')).toHaveAttribute('aria-level', '1');
    expect(item('Promos')).toHaveAttribute('aria-level', '2');
    expect(item('promo_a.mp4')).toHaveAttribute('aria-level', '3');
    expect(item('Media')).toHaveAttribute('aria-expanded', 'true');
    expect(item('promo_a.mp4')).not.toHaveAttribute('aria-expanded');
    expect(item('readme.txt')).not.toHaveAttribute('aria-expanded');
    expect(checkbox('Promos')).toBeInTheDocument();
    expect(checkbox('readme.txt')).toBeInTheDocument();
  });

  it('does not render children of collapsed folders; defaultExpanded opens folders; clicking a name toggles', async () => {
    const user = userEvent.setup();
    render(<Tree defaultExpanded={['media']} />);
    expect(item('Media')).toHaveAttribute('aria-expanded', 'true');
    expect(item('Promos')).toHaveAttribute('aria-expanded', 'false');
    expect(queryItem('promo_a.mp4')).not.toBeInTheDocument();
    expect(queryItem('autumn.json')).not.toBeInTheDocument();

    await user.click(screen.getByText('Promos'));
    expect(item('Promos')).toHaveAttribute('aria-expanded', 'true');
    expect(item('promo_a.mp4')).toBeInTheDocument();

    await user.click(screen.getByText('Promos'));
    expect(queryItem('promo_a.mp4')).not.toBeInTheDocument();
  });
});

describe('2. cascade down', () => {
  it('checking a folder adds every leaf under it; unchecking removes them', async () => {
    const user = userEvent.setup();
    const spy = jest.fn();
    render(<Tree initial={['readme']} spy={spy} />);

    await user.click(checkbox('Media'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect([...spy.mock.calls[0][0]].sort()).toEqual(['promo_a', 'promo_b', 'readme', 'trailer_1']);
    expect(checkbox('promo_a.mp4')).toBeChecked();
    expect(checkbox('trailer_1.mov')).toBeChecked();
    expect(checkbox('autumn.json')).not.toBeChecked();

    await user.click(checkbox('Media'));
    expect([...spy.mock.calls[1][0]]).toEqual(['readme']);
    expect(checkbox('promo_a.mp4')).not.toBeChecked();
  });

  it('checking a partially selected folder selects all of it and never reports folder ids', async () => {
    const user = userEvent.setup();
    const spy = jest.fn();
    render(<Tree initial={['promo_a']} spy={spy} />);
    await user.click(checkbox('Promos'));
    const next: Set<string> = spy.mock.calls[0][0];
    expect([...next].sort()).toEqual(['promo_a', 'promo_b']);
    expect(next.has('promos')).toBe(false);
    expect(next.has('media')).toBe(false);
  });
});

describe('3. derive up', () => {
  it('shows indeterminate + aria-checked=mixed for a partial folder and checked for a full one', async () => {
    const user = userEvent.setup();
    render(<Tree />);
    expect(item('Promos')).toHaveAttribute('aria-checked', 'false');

    await user.click(checkbox('promo_a.mp4'));
    expect(checkbox('Promos')).toBePartiallyChecked();
    expect(item('Promos')).toHaveAttribute('aria-checked', 'mixed');

    await user.click(checkbox('promo_b.mp4'));
    expect(checkbox('Promos')).toBeChecked();
    expect(checkbox('Promos')).not.toBePartiallyChecked();
    expect(item('Promos')).toHaveAttribute('aria-checked', 'true');
  });

  it('senior: one deep leaf makes parent and grandparent mixed while a sibling folder stays false', () => {
    render(<Tree initial={['trailer_1']} />);
    expect(item('Trailers')).toHaveAttribute('aria-checked', 'true');
    expect(item('Media')).toHaveAttribute('aria-checked', 'mixed');
    expect(checkbox('Media')).toBePartiallyChecked();
    expect(item('Promos')).toHaveAttribute('aria-checked', 'false');
    expect(checkbox('Promos')).not.toBePartiallyChecked();
    expect(item('Playlists')).toHaveAttribute('aria-checked', 'false');
  });
});

describe('4. controlled selection', () => {
  it('does not change when the parent ignores onChange, and follows value when it updates', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const { rerender } = render(
      <FileTree nodes={NODES} value={new Set()} onChange={onChange} defaultExpanded={ALL_EXPANDED} />,
    );
    await user.click(checkbox('readme.txt'));
    expect(onChange).toHaveBeenCalledWith(new Set(['readme']));
    expect(checkbox('readme.txt')).not.toBeChecked();

    rerender(
      <FileTree
        nodes={NODES}
        value={new Set(['autumn'])}
        onChange={onChange}
        defaultExpanded={ALL_EXPANDED}
      />,
    );
    expect(checkbox('autumn.json')).toBeChecked();
    expect(item('Playlists')).toHaveAttribute('aria-checked', 'true');
  });
});

describe('5. keyboard', () => {
  it('ArrowDown / ArrowUp walk visible items without wrapping; roving tabindex follows focus', async () => {
    const user = userEvent.setup();
    render(<Tree defaultExpanded={['media']} />);
    expect(visibleItemNames()).toEqual(['Media', 'Promos', 'Trailers', 'Playlists', 'readme.txt']);
    expect(item('Media')).toHaveAttribute('tabindex', '0');
    expect(item('Promos')).toHaveAttribute('tabindex', '-1');

    await user.tab();
    expect(item('Media')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(item('Promos')).toHaveFocus();
    expect(item('Promos')).toHaveAttribute('tabindex', '0');
    expect(item('Media')).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(item('readme.txt')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(item('Playlists')).toHaveFocus();
    expect(screen.getAllByRole('treeitem').filter((el) => el.tabIndex === 0)).toHaveLength(1);
  });

  it('Home / End jump to the first / last visible item', async () => {
    const user = userEvent.setup();
    render(<Tree />);
    await user.tab();
    await user.keyboard('{End}');
    expect(item('readme.txt')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(item('Media')).toHaveFocus();
  });

  it('ArrowRight expands then enters; ArrowLeft goes to parent then collapses', async () => {
    const user = userEvent.setup();
    render(<Tree defaultExpanded={[]} />);
    await user.tab();
    expect(item('Media')).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(item('Media')).toHaveAttribute('aria-expanded', 'true');
    expect(item('Media')).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(item('Promos')).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(item('Media')).toHaveFocus();
    expect(item('Media')).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(item('Media')).toHaveAttribute('aria-expanded', 'false');
    expect(queryItem('Promos')).not.toBeInTheDocument();
    expect(item('Media')).toHaveFocus();
  });

  it('Space toggles the focused checkbox through onChange; Enter toggles expansion', async () => {
    const user = userEvent.setup();
    const spy = jest.fn();
    render(<Tree defaultExpanded={['media']} spy={spy} />);
    await user.tab();
    await user.keyboard('{ArrowDown}'); // Promos
    await user.keyboard(' ');
    expect(spy).toHaveBeenCalledTimes(1);
    expect([...spy.mock.calls[0][0]].sort()).toEqual(['promo_a', 'promo_b']);
    expect(checkbox('Promos')).toBeChecked();

    await user.keyboard('{Enter}');
    expect(item('Promos')).toHaveAttribute('aria-expanded', 'true');
    expect(item('promo_a.mp4')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(item('Promos')).toHaveAttribute('aria-expanded', 'false');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('senior: collapsing a folder removes its children from the arrow-key order', async () => {
    const user = userEvent.setup();
    render(<Tree />);
    await user.tab();
    await user.keyboard('{ArrowDown}'); // Promos (expanded)
    await user.keyboard('{ArrowDown}');
    expect(item('promo_a.mp4')).toHaveFocus();

    await user.keyboard('{ArrowUp}'); // back to Promos
    await user.keyboard('{ArrowLeft}'); // collapse Promos
    expect(item('Promos')).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{ArrowDown}');
    expect(item('Trailers')).toHaveFocus();
    expect(within(screen.getByRole('tree')).queryByText('promo_a.mp4')).not.toBeInTheDocument();
  });
});
