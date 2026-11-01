/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterLab, filterItems } from './filter_lab';

const SMALL_ITEMS = ['Sentiment review', 'NER batch', 'Intent tagging', 'sentiment QA', 'Toxicity'];

/** 10k utterances: `utt-0000 …`. Query "utt-12" matches exactly utt-1200…utt-1299 (100 rows). */
const BIG_ITEMS = Array.from({ length: 10000 }, (_, i) => `utt-${String(i).padStart(4, '0')}`);

/**
 * Type into a React-controlled input WITHOUT act(): sets the value through the
 * native setter and dispatches `input`, exactly as a real keystroke would. This lets
 * the test observe the window between the urgent render and the deferred render.
 */
function nativeType(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Run `fn` outside React's act environment, then restore it for cleanup. */
async function outsideAct(fn: () => Promise<void>) {
  const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = g.IS_REACT_ACT_ENVIRONMENT;
  g.IS_REACT_ACT_ENVIRONMENT = false;
  try {
    await fn();
  } finally {
    g.IS_REACT_ACT_ENVIRONMENT = previous;
  }
}

const microtask = () => Promise.resolve();

function listItems(): string[] {
  return within(screen.getByRole('list', { name: 'Results' }))
    .queryAllByRole('listitem')
    .map((li) => li.textContent ?? '');
}

function statusText(): string {
  return screen.queryByRole('status')?.textContent?.trim() ?? '';
}

describe('091 filter lab — filterItems is a pure, case-insensitive substring filter', () => {
  it('returns every item for an empty query', () => {
    expect(filterItems(SMALL_ITEMS, '')).toEqual(SMALL_ITEMS);
  });

  it('matches case-insensitively anywhere in the string', () => {
    expect(filterItems(SMALL_ITEMS, 'SENT')).toEqual(['Sentiment review', 'sentiment QA']);
    expect(filterItems(SMALL_ITEMS, 'batch')).toEqual(['NER batch']);
  });

  it('returns an empty array when nothing matches and never mutates the input', () => {
    const copy = [...SMALL_ITEMS];
    expect(filterItems(SMALL_ITEMS, 'zzz')).toEqual([]);
    expect(SMALL_ITEMS).toEqual(copy);
    expect(filterItems(SMALL_ITEMS, '')).not.toBe(SMALL_ITEMS);
  });
});

describe('091 filter lab — rendering and basic filtering', () => {
  it('renders a labelled input, a named list, a match count and all items on mount', () => {
    render(<FilterLab items={SMALL_ITEMS} />);
    expect(screen.getByLabelText('Filter')).toHaveValue('');
    expect(screen.getByRole('list', { name: 'Results' })).toBeInTheDocument();
    expect(screen.getByText('5 matches')).toBeVisible();
    expect(listItems()).toEqual(SMALL_ITEMS);
    expect(statusText()).toBe('');
  });

  it('typing filters the list once the deferred value settles', async () => {
    const user = userEvent.setup();
    render(<FilterLab items={SMALL_ITEMS} />);

    await user.type(screen.getByLabelText('Filter'), 'sent');
    expect(screen.getByLabelText('Filter')).toHaveValue('sent');
    await waitFor(() => expect(listItems()).toEqual(['Sentiment review', 'sentiment QA']));
    expect(screen.getByText('2 matches')).toBeVisible();

    await user.type(screen.getByLabelText('Filter'), 'zzz');
    await waitFor(() => expect(screen.getByText('0 matches')).toBeVisible());
    expect(listItems()).toEqual([]);
  });

  it('caps the rendered rows at 50 while the count shows the real total', async () => {
    render(<FilterLab items={BIG_ITEMS} />);
    expect(screen.getByText('10000 matches')).toBeVisible();
    expect(listItems()).toHaveLength(50);
  });

  it('calls onListRender once on mount with the empty query', () => {
    const onListRender = jest.fn();
    render(<FilterLab items={SMALL_ITEMS} onListRender={onListRender} />);
    expect(onListRender.mock.calls.map((c) => c[0])).toEqual(['']);
  });
});

describe('091 filter lab — the input is urgent, the list is deferred', () => {
  it('after a burst of keystrokes the input shows the final text before the list catches up', async () => {
    const onListRender = jest.fn();
    render(<FilterLab items={BIG_ITEMS} onListRender={onListRender} />);
    const input = screen.getByLabelText('Filter') as HTMLInputElement;
    onListRender.mockClear();

    await outsideAct(async () => {
      nativeType(input, 'u');
      nativeType(input, 'ut');
      nativeType(input, 'utt-12');
      await microtask();

      // Urgent render has committed: the input is current …
      expect(input).toHaveValue('utt-12');
      // … but the list still shows the previous (empty-query) results.
      expect(screen.getByText('10000 matches')).toBeVisible();
      expect(onListRender.mock.calls.map((c) => c[0])).not.toContain('utt-12');

      await waitFor(() => expect(screen.getByText('100 matches')).toBeVisible());
      expect(listItems()[0]).toBe('utt-1200');
      expect(onListRender.mock.calls.map((c) => c[0])).toContain('utt-12');
    });
  });

  it('shows "Updating…" with role="status" while the list lags and clears it after', async () => {
    render(<FilterLab items={BIG_ITEMS} />);
    const input = screen.getByLabelText('Filter') as HTMLInputElement;
    expect(statusText()).toBe('');

    await outsideAct(async () => {
      nativeType(input, 'utt-99');
      await microtask();
      expect(screen.getByRole('status')).toHaveTextContent('Updating…');

      await waitFor(() => expect(screen.getByText('100 matches')).toBeVisible());
      await waitFor(() => expect(statusText()).toBe(''));
    });
  });

  it('every list render uses a prefix of the final typed value, and the last one is the final value', async () => {
    const onListRender = jest.fn();
    render(<FilterLab items={BIG_ITEMS} onListRender={onListRender} />);
    const input = screen.getByLabelText('Filter') as HTMLInputElement;
    onListRender.mockClear();

    await outsideAct(async () => {
      for (const v of ['u', 'ut', 'utt', 'utt-', 'utt-1', 'utt-12']) {
        nativeType(input, v);
        await microtask();
      }
      await waitFor(() => expect(screen.getByText('100 matches')).toBeVisible());
      await waitFor(() => expect(statusText()).toBe(''));
    });

    const queries = onListRender.mock.calls.map((c) => c[0] as string);
    expect(queries.length).toBeGreaterThan(0);
    for (const q of queries) expect('utt-12'.startsWith(q)).toBe(true);
    expect(queries[queries.length - 1]).toBe('utt-12');
  });
});

describe('091 filter lab — stale renders are discarded (senior)', () => {
  it('senior: with 10k items, interleaved keystrokes produce fewer list renders than keystrokes', async () => {
    const onListRender = jest.fn();
    render(<FilterLab items={BIG_ITEMS} onListRender={onListRender} />);
    const input = screen.getByLabelText('Filter') as HTMLInputElement;
    onListRender.mockClear();

    const keystrokes = ['u', 'ut', 'utt', 'utt-', 'utt-1', 'utt-12', 'utt-123'];
    await outsideAct(async () => {
      for (const v of keystrokes) {
        nativeType(input, v);
        await microtask(); // urgent render commits between keystrokes; deferred work is interrupted
      }
      await waitFor(() => expect(screen.getByText('10 matches')).toBeVisible());
      await waitFor(() => expect(statusText()).toBe(''));
    });

    const queries = onListRender.mock.calls.map((c) => c[0] as string);
    expect(queries.length).toBeLessThan(keystrokes.length);
    // The urgent (keystroke) renders must not re-render the list with its stale query.
    expect(queries.filter((q) => q === '')).toHaveLength(0);
    expect(queries[queries.length - 1]).toBe('utt-123');
    expect(listItems()).toEqual(BIG_ITEMS.slice(1230, 1240));
  });

  it('senior: unmounting mid-transition causes no errors or warnings', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<FilterLab items={BIG_ITEMS} />);
    const input = screen.getByLabelText('Filter') as HTMLInputElement;

    await outsideAct(async () => {
      nativeType(input, 'utt-4');
      await microtask();
      expect(screen.getByRole('status')).toHaveTextContent('Updating…');
    });

    expect(() => unmount()).not.toThrow();
    await new Promise((r) => setTimeout(r, 30)); // let any scheduled deferred work run
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('091 filter lab — a11y and implementation constraints', () => {
  it('the input is reachable by its label and the list rows are listitems', async () => {
    const user = userEvent.setup();
    render(<FilterLab items={SMALL_ITEMS} />);
    await user.tab();
    expect(screen.getByLabelText('Filter')).toHaveFocus();
    expect(within(screen.getByRole('list', { name: 'Results' })).getAllByRole('listitem')).toHaveLength(5);
  });

  it('uses concurrent deferral (useDeferredValue or useTransition), not a timer debounce', () => {
    const source = readFileSync(join(__dirname, 'filter_lab.tsx'), 'utf8');
    expect(source).toMatch(/useDeferredValue|useTransition/);
    expect(source).not.toMatch(/setTimeout\s*\(/);
  });
});
