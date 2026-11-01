/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parseUrlState, serializeUrlState, useUrlState, UrlSchema } from './use_url_state';
import { ReviewFilters } from './review_filters';

/** A small schema used by the pure-function and hook tests. */
type Demo = { page: number; status: 'all' | 'open'; q: string; task: string | null };
const demoSchema: UrlSchema<Demo> = {
  page: {
    parse: (raw) => {
      const n = Number(raw);
      return raw !== null && Number.isInteger(n) && n >= 1 ? n : 1;
    },
    serialize: (v) => String(v),
    default: 1,
  },
  status: {
    parse: (raw) => (raw === 'open' ? 'open' : 'all'),
    serialize: (v) => v,
    default: 'all',
  },
  q: { parse: (raw) => raw ?? '', serialize: (v) => (v === '' ? null : v), default: '' },
  task: { parse: (raw) => (raw ? raw : null), serialize: (v) => v, default: null },
};

function params(search: string = window.location.search): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(search));
}

/** Simulate a Back/Forward traversal: the browser changes the URL, then fires `popstate`. */
function traverseTo(url: string) {
  act(() => {
    window.history.replaceState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

function rowNames(): string[] {
  return within(screen.getByRole('list', { name: 'Review tasks' }))
    .getAllByRole('button')
    .map((b) => b.textContent?.split(' · ')[0] ?? '');
}

beforeEach(() => {
  jest.useFakeTimers();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('089 url state — parseUrlState falls back safely', () => {
  it('returns every default for an empty search string', () => {
    expect(parseUrlState(demoSchema, '')).toEqual({ page: 1, status: 'all', q: '', task: null });
  });

  it('parses valid values and ignores unknown keys', () => {
    expect(parseUrlState(demoSchema, '?page=3&status=open&q=ner&task=t-9&junk=1')).toEqual({
      page: 3,
      status: 'open',
      q: 'ner',
      task: 't-9',
    });
  });

  it('invalid raw values fall back to the default (page=abc → 1, status=bogus → all)', () => {
    expect(parseUrlState(demoSchema, '?page=abc&status=bogus')).toEqual({
      page: 1,
      status: 'all',
      q: '',
      task: null,
    });
    expect(parseUrlState(demoSchema, '?page=0')).toMatchObject({ page: 1 });
    expect(parseUrlState(demoSchema, '?page=-2&page=4')).toMatchObject({ page: 1 });
  });
});

describe('089 url state — serializeUrlState produces clean URLs', () => {
  it('returns an empty string when every value equals its default', () => {
    expect(serializeUrlState(demoSchema, { page: 1, status: 'all', q: '', task: null })).toBe('');
  });

  it('writes only the keys that differ from their default', () => {
    const search = serializeUrlState(demoSchema, { page: 2, status: 'all', q: 'ner', task: null });
    expect(search.startsWith('?')).toBe(true);
    expect(params(search)).toEqual({ page: '2', q: 'ner' });
  });

  it('round-trips through parseUrlState', () => {
    const state: Demo = { page: 7, status: 'open', q: 'a b&c=d', task: 't-1' };
    expect(parseUrlState(demoSchema, serializeUrlState(demoSchema, state))).toEqual(state);
  });
});

describe('089 url state — useUrlState hook', () => {
  it('reads the initial state from window.location.search on mount', () => {
    window.history.replaceState({}, '', '/?page=4&status=open');
    const { result } = renderHook(() => useUrlState(demoSchema));
    expect(result.current[0]).toEqual({ page: 4, status: 'open', q: '', task: null });
  });

  it('setState merges a partial update, pushes a history entry and updates the URL', () => {
    const before = window.history.length;
    const { result } = renderHook(() => useUrlState(demoSchema));
    act(() => result.current[1]({ page: 2 }));
    act(() => result.current[1]({ status: 'open' }));

    expect(result.current[0]).toEqual({ page: 2, status: 'open', q: '', task: null });
    expect(params()).toEqual({ page: '2', status: 'open' });
    expect(window.history.length).toBe(before + 2);
  });

  it('setState with { replace: true } uses replaceState and adds no history entry', () => {
    const push = jest.spyOn(window.history, 'pushState');
    const replace = jest.spyOn(window.history, 'replaceState');
    const before = window.history.length;
    const { result } = renderHook(() => useUrlState(demoSchema));

    act(() => result.current[1]({ q: 'ner' }, { replace: true }));

    expect(result.current[0].q).toBe('ner');
    expect(params()).toEqual({ q: 'ner' });
    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(window.history.length).toBe(before);
  });

  it('setting a key back to its default removes it from the URL', () => {
    const { result } = renderHook(() => useUrlState(demoSchema));
    act(() => result.current[1]({ page: 3, task: 't-2' }));
    act(() => result.current[1]({ page: 1, task: null }));
    expect(window.location.search).toBe('');
  });

  it('popstate (Back/Forward) re-reads the URL into state', () => {
    const { result } = renderHook(() => useUrlState(demoSchema));
    act(() => result.current[1]({ page: 2 }));
    traverseTo('/?page=5&status=open');
    expect(result.current[0]).toEqual({ page: 5, status: 'open', q: '', task: null });
    traverseTo('/');
    expect(result.current[0]).toEqual({ page: 1, status: 'all', q: '', task: null });
  });

  it('removes its popstate listener on unmount', () => {
    const remove = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useUrlState(demoSchema));
    unmount();
    expect(remove.mock.calls.some(([type]) => type === 'popstate')).toBe(true);
  });
});

describe('089 review filters — initial render from a shareable link', () => {
  it('restores status, page and selected task from the URL', () => {
    window.history.replaceState({}, '', '/?status=approved&page=2&task=t-17');
    render(<ReviewFilters />);

    expect(screen.getByLabelText('Status')).toHaveValue('approved');
    expect(screen.getByText('Page 2 of 2')).toBeVisible();
    expect(rowNames()).toEqual(['t-17', 't-20', 't-23']);
    expect(screen.getByRole('button', { name: /^t-17 / })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^t-20 / })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Selected task: t-17')).toBeVisible();
  });

  it('invalid params fall back to defaults without rewriting the URL on mount', () => {
    window.history.replaceState({}, '', '/?page=abc&status=bogus&task=');
    const push = jest.spyOn(window.history, 'pushState');
    const replace = jest.spyOn(window.history, 'replaceState');
    render(<ReviewFilters />);

    expect(screen.getByLabelText('Status')).toHaveValue('all');
    expect(screen.getByText('Page 1 of 5')).toBeVisible();
    expect(rowNames()).toEqual(['t-1', 't-2', 't-3', 't-4', 't-5']);
    expect(screen.getByText('Selected task: none')).toBeVisible();
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('exposes labelled controls and a named list', () => {
    render(<ReviewFilters />);
    expect(screen.getByLabelText('Search')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Review tasks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });
});

describe('089 review filters — status select pushes history', () => {
  it('changing status updates the URL with pushState and resets the page to 1', async () => {
    window.history.replaceState({}, '', '/?page=3');
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const before = window.history.length;
    render(<ReviewFilters />);

    await user.selectOptions(screen.getByLabelText('Status'), 'approved');

    expect(params()).toEqual({ status: 'approved' });
    expect(window.history.length).toBe(before + 1);
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
    expect(rowNames()).toEqual(['t-2', 't-5', 't-8', 't-11', 't-14']);
  });

  it('selecting "all" again leaves a clean URL', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ReviewFilters />);
    await user.selectOptions(screen.getByLabelText('Status'), 'rejected');
    await user.selectOptions(screen.getByLabelText('Status'), 'all');
    expect(window.location.search).toBe('');
    expect(screen.getByText('Page 1 of 5')).toBeVisible();
  });
});

describe('089 review filters — paging', () => {
  it('Next/Previous push history entries and clamp at the bounds', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const before = window.history.length;
    render(<ReviewFilters />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(params()).toEqual({ page: '2' });
    expect(rowNames()).toEqual(['t-6', 't-7', 't-8', 't-9', 't-10']);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(window.location.search).toBe('');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(window.history.length).toBe(before + 2);
  });

  it('Next is disabled on the last page', () => {
    window.history.replaceState({}, '', '/?page=5');
    render(<ReviewFilters />);
    expect(screen.getByText('Page 5 of 5')).toBeVisible();
    expect(rowNames()).toEqual(['t-21', 't-22', 't-23']);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('a page beyond the range is clamped for display', () => {
    window.history.replaceState({}, '', '/?page=99');
    render(<ReviewFilters />);
    expect(screen.getByText('Page 5 of 5')).toBeVisible();
    expect(rowNames()).toEqual(['t-21', 't-22', 't-23']);
  });
});

describe('089 review filters — selecting a task row', () => {
  it('clicking a row writes task=<id> with pushState and marks it pressed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const push = jest.spyOn(window.history, 'pushState');
    render(<ReviewFilters />);

    await user.click(screen.getByRole('button', { name: /^t-3 / }));

    expect(params()).toEqual({ task: 't-3' });
    expect(push).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Selected task: t-3')).toBeVisible();
    expect(screen.getByRole('button', { name: /^t-3 / })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^t-1 / })).toHaveAttribute('aria-pressed', 'false');
  });

  it('rows are keyboard operable (Enter on a focused row selects it)', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ReviewFilters />);
    screen.getByRole('button', { name: /^t-2 / }).focus();
    await user.keyboard('{Enter}');
    expect(params()).toEqual({ task: 't-2' });
  });
});

describe('089 review filters — debounced search uses replaceState', () => {
  it('the URL does not change until 300 ms after the last keystroke', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ReviewFilters />);

    await user.type(screen.getByLabelText('Search'), 'ner');
    expect(screen.getByLabelText('Search')).toHaveValue('ner');
    expect(window.location.search).toBe('');

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(window.location.search).toBe('');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(params()).toEqual({ q: 'ner' });
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
    expect(rowNames()).toEqual(['t-2', 't-6', 't-10', 't-14', 't-18']);
  });

  it('senior: typing 5 characters adds zero history entries and writes the URL once', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const push = jest.spyOn(window.history, 'pushState');
    const replace = jest.spyOn(window.history, 'replaceState');
    const before = window.history.length;
    render(<ReviewFilters />);

    await user.type(screen.getByLabelText('Search'), 'toxic');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(params()).toEqual({ q: 'toxic' });
    expect(window.history.length).toBe(before);
    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('a search change resets the page to 1 and keeps the status filter', async () => {
    window.history.replaceState({}, '', '/?status=pending&page=2');
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ReviewFilters />);

    await user.type(screen.getByLabelText('Search'), 'sent');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(params()).toEqual({ status: 'pending', q: 'sent' });
    expect(rowNames()).toEqual(['t-1', 't-13']);
  });

  it('shows an empty-state message when nothing matches', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ReviewFilters />);
    await user.type(screen.getByLabelText('Search'), 'zzz');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.getByText('No tasks match')).toBeVisible();
    expect(screen.getByText('Page 1 of 1')).toBeVisible();
  });
});

describe('089 review filters — Back/Forward restore state', () => {
  it('senior: Back after changing status restores the previous status in the UI', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ReviewFilters />);

    await user.selectOptions(screen.getByLabelText('Status'), 'approved');
    expect(screen.getByLabelText('Status')).toHaveValue('approved');

    traverseTo('/'); // Back
    expect(screen.getByLabelText('Status')).toHaveValue('all');
    expect(screen.getByText('Page 1 of 5')).toBeVisible();

    traverseTo('/?status=approved'); // Forward
    expect(screen.getByLabelText('Status')).toHaveValue('approved');
    expect(rowNames()).toEqual(['t-2', 't-5', 't-8', 't-11', 't-14']);
  });

  it('senior: Back restores the search text in the input and does not re-write the URL', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ReviewFilters />);

    await user.type(screen.getByLabelText('Search'), 'ner');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await user.selectOptions(screen.getByLabelText('Status'), 'rejected');
    expect(params()).toEqual({ q: 'ner', status: 'rejected' });

    traverseTo('/?q=ner'); // Back: status change undone, search kept
    expect(screen.getByLabelText('Status')).toHaveValue('all');
    expect(screen.getByLabelText('Search')).toHaveValue('ner');

    traverseTo('/'); // Back again: search undone
    expect(screen.getByLabelText('Search')).toHaveValue('');
    expect(rowNames()).toEqual(['t-1', 't-2', 't-3', 't-4', 't-5']);

    // The restored input value must NOT be treated as fresh typing (no debounced write-back).
    const push = jest.spyOn(window.history, 'pushState');
    const replace = jest.spyOn(window.history, 'replaceState');
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.search).toBe('');
  });

  it('works with the real history.back() traversal in jsdom', async () => {
    jest.useRealTimers();
    const user = userEvent.setup();
    render(<ReviewFilters />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: /^t-7 / }));
    expect(params()).toEqual({ page: '2', task: 't-7' });

    window.history.back();
    await waitFor(() => expect(screen.getByText('Selected task: none')).toBeVisible());
    expect(screen.getByText('Page 2 of 5')).toBeVisible();

    window.history.back();
    await waitFor(() => expect(screen.getByText('Page 1 of 5')).toBeVisible());
  });
});
