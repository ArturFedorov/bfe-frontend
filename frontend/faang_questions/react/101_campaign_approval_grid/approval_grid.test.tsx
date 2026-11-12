/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deferred, flush, type Deferred } from '../_helpers/deferred';
import {
  ApprovalGrid,
  DEFAULT_PARAMS,
  parseGridParams,
  serializeGridParams,
  type ApprovalApi,
  type Campaign,
  type CampaignStatus,
  type ListParams,
  type ListResult,
} from './approval_grid';

// ---- fixtures ---------------------------------------------------------------

const campaign = (n: number, status: CampaignStatus = 'pending'): Campaign => ({
  id: `c${n}`,
  name: `Campaign ${n}`,
  status,
  updatedAt: `2026-03-${String(n).padStart(2, '0')}T09:00:00Z`,
});

const PAGE1 = [campaign(1), campaign(2), campaign(3)];
const PAGE2 = [campaign(4), campaign(5), campaign(6)];
const PAGE3 = [campaign(7)];
const TOTAL = 7;

function makeApi() {
  const lists: Array<{ d: Deferred<ListResult>; params: ListParams }> = [];
  const approves: Array<{ d: Deferred<void>; ids: string[] }> = [];
  const api: ApprovalApi = {
    list: jest.fn((params: ListParams) => {
      const d = deferred<ListResult>();
      lists.push({ d, params });
      return d.promise;
    }),
    approve: jest.fn((ids: string[]) => {
      const d = deferred<void>();
      approves.push({ d, ids });
      return d.promise;
    }),
  };
  return { api, lists, approves };
}

type Api = ReturnType<typeof makeApi>;

async function resolveList(api: Api, index: number, rows: Campaign[], total = TOTAL) {
  await act(async () => {
    api.lists[index].d.resolve({ rows, total });
    await flush();
  });
}

async function settleApprove(api: Api, index: number, error?: string) {
  await act(async () => {
    if (error) api.approves[index].d.reject(new Error(error));
    else api.approves[index].d.resolve();
    await flush();
  });
}

/** Simulate Back/Forward: the browser changes the URL, then fires popstate. */
function traverseTo(url: string) {
  act(() => {
    window.history.replaceState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

function setup(pageSize = 3) {
  const api = makeApi();
  const user = userEvent.setup();
  const utils = render(<ApprovalGrid api={api.api} pageSize={pageSize} />);
  return { ...api, user, ...utils };
}

const grid = () => screen.getByRole('grid', { name: 'Campaign approvals' });
const bodyRows = () =>
  within(grid())
    .getAllByRole('row')
    .filter((r) => within(r).queryAllByRole('gridcell').length > 0);
const rowNames = () =>
  bodyRows()
    .map((r) => within(r).queryByRole('checkbox'))
    .filter((cb): cb is HTMLElement => cb !== null)
    .map((cb) => cb.getAttribute('aria-label')!.replace('Select ', ''));
const checkbox = (name: string) => screen.getByRole('checkbox', { name: `Select ${name}` });
const pageCheckbox = () => screen.getByRole('checkbox', { name: 'Select page' }) as HTMLInputElement;
const statusSelect = () => screen.getByRole('combobox', { name: 'Status' }) as HTMLSelectElement;
const sortSelect = () => screen.getByRole('combobox', { name: 'Sort' }) as HTMLSelectElement;
const approveButton = () => screen.getByRole('button', { name: 'Approve selected' });
const lastListParams = (api: Api) => api.lists[api.lists.length - 1].params;

beforeEach(() => {
  window.history.replaceState({}, '', '/approvals');
});

describe('pure helpers', () => {
  it('parseGridParams returns defaults for an empty search and parses valid values', () => {
    expect(parseGridParams('')).toEqual(DEFAULT_PARAMS);
    expect(parseGridParams('?page=2&status=pending&sort=updatedAt')).toEqual({
      page: 2,
      status: 'pending',
      sort: 'updatedAt',
    });
    expect(parseGridParams('?status=approved&unknown=1')).toEqual({ page: 1, status: 'approved', sort: 'name' });
  });

  it('parseGridParams falls back for invalid values', () => {
    expect(parseGridParams('?page=abc')).toEqual(DEFAULT_PARAMS);
    expect(parseGridParams('?page=0')).toEqual(DEFAULT_PARAMS);
    expect(parseGridParams('?page=-3')).toEqual(DEFAULT_PARAMS);
    expect(parseGridParams('?status=bogus&sort=bogus&page=4')).toEqual({ page: 4, status: 'all', sort: 'name' });
  });

  it('serializeGridParams omits defaults, returns "" for all-default and round-trips', () => {
    expect(serializeGridParams({ page: 1, status: 'all', sort: 'name' })).toBe('');
    expect(serializeGridParams({ page: 2, status: 'all', sort: 'name' })).toBe('?page=2');
    const full = { page: 3, status: 'pending' as const, sort: 'updatedAt' as const };
    const s = serializeGridParams(full);
    expect(s.startsWith('?')).toBe(true);
    expect(Object.fromEntries(new URLSearchParams(s))).toEqual({ page: '3', status: 'pending', sort: 'updatedAt' });
    expect(parseGridParams(s)).toEqual(full);
  });
});

describe('1-3. URL as filter state and server paging', () => {
  it('requests page 1 with defaults on mount, shows the loading row, then renders rows', async () => {
    const t = setup();
    expect(t.api.list).toHaveBeenCalledTimes(1);
    expect(lastListParams(t)).toEqual({ page: 1, pageSize: 3, status: 'all', sort: 'name' });
    expect(grid()).toHaveAttribute('aria-busy', 'true');
    expect(within(grid()).getByText('Loading…')).toBeInTheDocument();

    await resolveList(t, 0, PAGE1);
    expect(grid()).toHaveAttribute('aria-busy', 'false');
    expect(within(grid()).queryByText('Loading…')).not.toBeInTheDocument();
    expect(rowNames()).toEqual(['Campaign 1', 'Campaign 2', 'Campaign 3']);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('defaults pageSize to 10', () => {
    const api = makeApi();
    render(<ApprovalGrid api={api.api} />);
    expect(lastListParams(api).pageSize).toBe(10);
  });

  it('reads page, status and sort from the URL and does not rewrite the URL on mount', () => {
    window.history.replaceState({}, '', '/approvals?page=2&status=pending&sort=updatedAt');
    const push = jest.spyOn(window.history, 'pushState');
    const replace = jest.spyOn(window.history, 'replaceState');
    const t = setup();
    expect(lastListParams(t)).toEqual({ page: 2, pageSize: 3, status: 'pending', sort: 'updatedAt' });
    expect(statusSelect().value).toBe('pending');
    expect(sortSelect().value).toBe('updatedAt');
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    push.mockRestore();
    replace.mockRestore();
  });

  it('status change pushes one history entry, resets the page and refetches', async () => {
    window.history.replaceState({}, '', '/approvals?page=2');
    const t = setup();
    await resolveList(t, 0, PAGE2);
    const push = jest.spyOn(window.history, 'pushState');

    await t.user.selectOptions(statusSelect(), 'pending');
    expect(push).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe('?status=pending');
    expect(window.location.pathname).toBe('/approvals');
    expect(t.api.list).toHaveBeenCalledTimes(2);
    expect(lastListParams(t)).toEqual({ page: 1, pageSize: 3, status: 'pending', sort: 'name' });
    push.mockRestore();
  });

  it('sort and paging write the URL; returning to defaults yields a clean URL', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);

    await t.user.selectOptions(sortSelect(), 'updatedAt');
    expect(window.location.search).toBe('?sort=updatedAt');
    expect(lastListParams(t)).toMatchObject({ page: 1, sort: 'updatedAt' });
    await resolveList(t, 1, PAGE1);

    await t.user.click(screen.getByRole('button', { name: 'Next' }));
    expect(Object.fromEntries(new URLSearchParams(window.location.search))).toEqual({ page: '2', sort: 'updatedAt' });
    expect(lastListParams(t)).toMatchObject({ page: 2, sort: 'updatedAt' });
    await resolveList(t, 2, PAGE2);
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    await t.user.click(screen.getByRole('button', { name: 'Previous' }));
    await t.user.selectOptions(sortSelect(), 'name');
    expect(window.location.search).toBe('');
  });

  it('popstate (Back) restores the filters and refetches', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);
    await t.user.selectOptions(statusSelect(), 'approved');
    expect(statusSelect().value).toBe('approved');
    expect(t.api.list).toHaveBeenCalledTimes(2);

    traverseTo('/approvals');
    expect(statusSelect().value).toBe('all');
    expect(t.api.list).toHaveBeenCalledTimes(3);
    expect(lastListParams(t)).toMatchObject({ page: 1, status: 'all' });

    traverseTo('/approvals?page=3&sort=updatedAt');
    expect(sortSelect().value).toBe('updatedAt');
    expect(lastListParams(t)).toMatchObject({ page: 3, sort: 'updatedAt' });
    await resolveList(t, 3, PAGE3);
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('renders "No campaigns" for an empty page', async () => {
    const t = setup();
    await resolveList(t, 0, [], 0);
    expect(within(grid()).getByText('No campaigns')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });
});

describe('4. stale responses are ignored', () => {
  it('senior: an earlier page response resolving after a later one does not replace the rows', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);

    await t.user.click(screen.getByRole('button', { name: 'Next' }));
    await t.user.click(screen.getByRole('button', { name: 'Next' }));
    expect(t.api.list).toHaveBeenCalledTimes(3);
    expect(t.lists[1].params.page).toBe(2);
    expect(t.lists[2].params.page).toBe(3);

    await resolveList(t, 2, PAGE3);
    expect(rowNames()).toEqual(['Campaign 7']);
    expect(grid()).toHaveAttribute('aria-busy', 'false');

    await resolveList(t, 1, PAGE2);
    expect(rowNames()).toEqual(['Campaign 7']);
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
  });
});

describe('5. selection keyed by id', () => {
  it('row checkboxes toggle selection, aria-selected and the status count', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);
    expect(screen.getByRole('status')).toHaveTextContent('0 selected');

    await t.user.click(checkbox('Campaign 2'));
    expect(checkbox('Campaign 2')).toBeChecked();
    expect(bodyRows()[1]).toHaveAttribute('aria-selected', 'true');
    expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');

    await t.user.click(checkbox('Campaign 2'));
    expect(checkbox('Campaign 2')).not.toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('0 selected');
  });

  it('Select page is indeterminate for a partial selection, checked when all, and toggles the page', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);
    expect(pageCheckbox().checked).toBe(false);
    expect(pageCheckbox().indeterminate).toBe(false);

    await t.user.click(checkbox('Campaign 1'));
    expect(pageCheckbox().indeterminate).toBe(true);
    expect(pageCheckbox().checked).toBe(false);

    await t.user.click(pageCheckbox());
    expect(pageCheckbox().checked).toBe(true);
    expect(pageCheckbox().indeterminate).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent('3 selected');

    await t.user.click(pageCheckbox());
    expect(pageCheckbox().checked).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent('0 selected');
  });

  it('selection survives paging and sorting', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);
    await t.user.click(checkbox('Campaign 1'));

    await t.user.click(screen.getByRole('button', { name: 'Next' }));
    await resolveList(t, 1, PAGE2);
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');
    await t.user.click(checkbox('Campaign 5'));
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');

    await t.user.click(screen.getByRole('button', { name: 'Previous' }));
    await resolveList(t, 2, PAGE1);
    expect(checkbox('Campaign 1')).toBeChecked();
    expect(checkbox('Campaign 2')).not.toBeChecked();
    expect(pageCheckbox().indeterminate).toBe(true);

    await t.user.selectOptions(sortSelect(), 'updatedAt');
    await resolveList(t, 3, [campaign(3), campaign(1), campaign(2)]);
    expect(rowNames()).toEqual(['Campaign 3', 'Campaign 1', 'Campaign 2']);
    expect(checkbox('Campaign 1')).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');
  });
});

describe('6. optimistic approve', () => {
  it('is disabled with nothing selected', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);
    expect(approveButton()).toBeDisabled();
    await t.user.click(checkbox('Campaign 1'));
    expect(approveButton()).toBeEnabled();
  });

  it('hides the rows immediately, calls approve once, then clears selection and refetches', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);
    await t.user.click(checkbox('Campaign 1'));
    await t.user.click(checkbox('Campaign 3'));

    await t.user.click(approveButton());
    expect(t.api.approve).toHaveBeenCalledTimes(1);
    expect([...t.approves[0].ids].sort()).toEqual(['c1', 'c3']);
    expect(rowNames()).toEqual(['Campaign 2']);
    expect(approveButton()).toBeDisabled();
    expect(t.api.list).toHaveBeenCalledTimes(1);

    await settleApprove(t, 0);
    expect(screen.getByRole('status')).toHaveTextContent('0 selected');
    expect(t.api.list).toHaveBeenCalledTimes(2);
    expect(lastListParams(t)).toEqual({ page: 1, pageSize: 3, status: 'all', sort: 'name' });
    expect(screen.queryByText('Campaign 1')).not.toBeInTheDocument();

    await resolveList(t, 1, [campaign(2), campaign(4), campaign(5)], 5);
    expect(rowNames()).toEqual(['Campaign 2', 'Campaign 4', 'Campaign 5']);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rolls back on rejection: rows return, selection kept, alert shows the message', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);
    await t.user.click(checkbox('Campaign 2'));
    await t.user.click(approveButton());
    expect(rowNames()).toEqual(['Campaign 1', 'Campaign 3']);

    await settleApprove(t, 0, 'Approval service unavailable');
    expect(rowNames()).toEqual(['Campaign 1', 'Campaign 2', 'Campaign 3']);
    expect(checkbox('Campaign 2')).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');
    expect(screen.getByRole('alert')).toHaveTextContent('Approval service unavailable');
    expect(approveButton()).toBeEnabled();
    expect(t.api.list).toHaveBeenCalledTimes(1);

    // Retrying clears the alert.
    await t.user.click(approveButton());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(t.api.approve).toHaveBeenCalledTimes(2);
  });
});

describe('7. approve while a page fetch is in flight', () => {
  it('senior: a list response containing an approving id keeps it hidden; rejection brings it back', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);
    await t.user.click(checkbox('Campaign 1'));
    await t.user.click(approveButton());
    expect(rowNames()).toEqual(['Campaign 2', 'Campaign 3']);

    await t.user.selectOptions(sortSelect(), 'updatedAt');
    expect(t.api.list).toHaveBeenCalledTimes(2);
    expect(within(grid()).getByText('Loading…')).toBeInTheDocument();

    // Server has not processed the approval yet: c1 is still in the response.
    await resolveList(t, 1, [campaign(3), campaign(1), campaign(2)]);
    expect(rowNames()).toEqual(['Campaign 3', 'Campaign 2']);
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');

    await settleApprove(t, 0, 'Approval rejected by policy');
    expect(rowNames()).toEqual(['Campaign 3', 'Campaign 1', 'Campaign 2']);
    expect(checkbox('Campaign 1')).toBeChecked();
    expect(screen.getByRole('alert')).toHaveTextContent('Approval rejected by policy');
  });

  it('senior: approve succeeding while a fetch is pending refetches once the latest params and shows that result', async () => {
    const t = setup();
    await resolveList(t, 0, PAGE1);
    await t.user.click(checkbox('Campaign 2'));
    await t.user.click(approveButton());

    await t.user.click(screen.getByRole('button', { name: 'Next' }));
    expect(t.api.list).toHaveBeenCalledTimes(2);

    await settleApprove(t, 0);
    expect(screen.getByRole('status')).toHaveTextContent('0 selected');
    expect(t.api.list).toHaveBeenCalledTimes(3);
    expect(lastListParams(t)).toMatchObject({ page: 2 });

    // The superseded page-2 request resolves late and must be ignored...
    await resolveList(t, 1, [campaign(2), campaign(4), campaign(5)]);
    expect(within(grid()).getByText('Loading…')).toBeInTheDocument();

    // ...while the refetch is what fills the grid.
    await resolveList(t, 2, [campaign(4), campaign(5), campaign(6)], 6);
    expect(rowNames()).toEqual(['Campaign 4', 'Campaign 5', 'Campaign 6']);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });
});
