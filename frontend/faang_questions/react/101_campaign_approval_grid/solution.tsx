import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';

export type CampaignStatus = 'pending' | 'approved';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  /** ISO timestamp. */
  updatedAt: string;
}

export type StatusFilter = 'all' | 'pending' | 'approved';
export type SortKey = 'name' | 'updatedAt';

export interface ListParams {
  page: number;
  pageSize: number;
  status: StatusFilter;
  sort: SortKey;
}

export interface ListResult {
  rows: Campaign[];
  total: number;
}

export interface ApprovalApi {
  list(params: ListParams): Promise<ListResult>;
  approve(ids: string[]): Promise<void>;
}

/** The part of the state that lives in the URL. */
export interface GridParams {
  page: number;
  status: StatusFilter;
  sort: SortKey;
}

export const DEFAULT_PARAMS: Readonly<GridParams> = { page: 1, status: 'all', sort: 'name' };

export interface ApprovalGridProps {
  api: ApprovalApi;
  /** Rows per page. Default 10. */
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Pure URL helpers
// ---------------------------------------------------------------------------

const STATUS_FILTERS: readonly StatusFilter[] = ['all', 'pending', 'approved'];
const SORT_KEYS: readonly SortKey[] = ['name', 'updatedAt'];

const isStatusFilter = (v: string | null): v is StatusFilter => STATUS_FILTERS.includes(v as StatusFilter);
const isSortKey = (v: string | null): v is SortKey => SORT_KEYS.includes(v as SortKey);

/** Parses `?page=2&status=pending&sort=updatedAt`; invalid values fall back to defaults. */
export function parseGridParams(search: string): GridParams {
  const query = new URLSearchParams(search);
  // `Number(null)` is 0 and `Number('abc')` is NaN — both fail the >= 1 check.
  const page = Number(query.get('page'));
  const status = query.get('status');
  const sort = query.get('sort');
  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_PARAMS.page,
    status: isStatusFilter(status) ? status : DEFAULT_PARAMS.status,
    sort: isSortKey(sort) ? sort : DEFAULT_PARAMS.sort,
  };
}

/** Returns '' when every value is default, otherwise a string starting with '?'. */
export function serializeGridParams(params: GridParams): string {
  const query = new URLSearchParams();
  if (params.page !== DEFAULT_PARAMS.page) query.set('page', String(params.page));
  if (params.status !== DEFAULT_PARAMS.status) query.set('status', params.status);
  if (params.sort !== DEFAULT_PARAMS.sort) query.set('sort', params.sort);
  const s = query.toString();
  return s ? `?${s}` : '';
}

// ---------------------------------------------------------------------------
// Small Set helpers — selection and hidden ids are Sets keyed by campaign id.
// ---------------------------------------------------------------------------

function withToggled(set: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function withAll(set: ReadonlySet<string>, ids: Iterable<string>, present: boolean): Set<string> {
  const next = new Set(set);
  for (const id of ids) {
    if (present) next.add(id);
    else next.delete(id);
  }
  return next;
}

const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * State shape:
 * - `params` mirrors the URL; it is the only input to `api.list`.
 * - `rows` / `total` / `loading` are the latest accepted page response.
 * - `selection` is a Set of ids so it survives paging and sorting.
 * - Two hidden-id Sets drive the optimistic approve: `approving` holds ids
 *   whose `approve()` call is in flight, `awaitingRefresh` holds ids the server
 *   has accepted but that may still appear in a page response until the
 *   refetch lands. A list response may clear the second set, never the first.
 * - `reqId` is a monotonically increasing request counter: a response is only
 *   applied if it belongs to the most recent request.
 */
export function ApprovalGrid({ api, pageSize = 10 }: ApprovalGridProps): ReactElement {
  const [params, setParams] = useState<GridParams>(() => parseGridParams(window.location.search));
  const [rows, setRows] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<ReadonlySet<string>>(() => new Set());
  const [approving, setApproving] = useState<ReadonlySet<string>>(() => new Set());
  const [awaitingRefresh, setAwaitingRefresh] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  // Bumped to re-request the current page without changing `params`.
  const [refreshTick, setRefreshTick] = useState(0);
  const reqId = useRef(0);

  // --- URL sync -------------------------------------------------------------

  const navigate = (next: GridParams) => {
    const { pathname, hash } = window.location;
    window.history.pushState(null, '', `${pathname}${serializeGridParams(next)}${hash}`);
    setParams(next);
  };

  useEffect(() => {
    // Back/Forward: the browser has already changed the URL; re-parse it.
    const onPopState = () => setParams(parseGridParams(window.location.search));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // --- Server paging --------------------------------------------------------

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    api.list({ page: params.page, pageSize, status: params.status, sort: params.sort }).then(
      (result) => {
        if (id !== reqId.current) return; // superseded by a newer request
        setRows(result.rows);
        setTotal(result.total);
        setLoading(false);
        // The server has now reflected any approvals that had completed before
        // this request was made. Approvals still in flight stay hidden.
        setAwaitingRefresh(new Set());
      },
      (e: unknown) => {
        if (id !== reqId.current) return;
        setLoading(false);
        setError(errorMessage(e));
      },
    );
  }, [api, pageSize, params.page, params.status, params.sort, refreshTick]);

  // --- Derived view ---------------------------------------------------------

  const hidden = new Set([...approving, ...awaitingRefresh]);
  const visibleRows = rows.filter((row) => !hidden.has(row.id));
  const visibleSelectedCount = visibleRows.filter((row) => selection.has(row.id)).length;
  const allVisibleSelected = visibleRows.length > 0 && visibleSelectedCount === visibleRows.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const isApproving = approving.size > 0;

  // --- Handlers -------------------------------------------------------------

  const togglePage = () =>
    setSelection((prev) => withAll(prev, visibleRows.map((row) => row.id), !allVisibleSelected));

  const approveSelected = async () => {
    const ids = Array.from(selection);
    if (ids.length === 0 || isApproving) return;

    setError(null);
    setApproving(new Set(ids)); // optimistic: rows disappear now

    try {
      await api.approve(ids);
      // Confirmed: forget the selection, keep the rows hidden until the page
      // is re-read from the server, then re-request the current params.
      setSelection((prev) => withAll(prev, ids, false));
      setAwaitingRefresh((prev) => withAll(prev, ids, true));
      setRefreshTick((tick) => tick + 1);
    } catch (e) {
      // Rollback: the rows come back, the selection was never touched.
      setError(errorMessage(e));
    } finally {
      setApproving(new Set());
    }
  };

  // --- Render ---------------------------------------------------------------

  return (
    <div className="approval-grid">
      <div className="approval-grid__filters">
        <select
          aria-label="Status"
          value={params.status}
          onChange={(e) => navigate({ ...params, status: e.target.value as StatusFilter, page: 1 })}
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort"
          value={params.sort}
          onChange={(e) => navigate({ ...params, sort: e.target.value as SortKey, page: 1 })}
        >
          <option value="name">Name</option>
          <option value="updatedAt">Updated</option>
        </select>
      </div>

      <table role="grid" aria-label="Campaign approvals" aria-busy={loading}>
        <thead>
          <tr role="row">
            <th role="columnheader">
              <input
                type="checkbox"
                aria-label="Select page"
                checked={allVisibleSelected}
                disabled={visibleRows.length === 0}
                // `indeterminate` is a DOM property, not an attribute, so it is
                // set through a ref callback. The inline callback re-runs on
                // every commit, which keeps it in step with the selection.
                ref={(el) => {
                  if (el) el.indeterminate = someVisibleSelected;
                }}
                onChange={togglePage}
              />
            </th>
            <th role="columnheader">Name</th>
            <th role="columnheader">Status</th>
            <th role="columnheader">Updated</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr role="row">
              <td role="gridcell" colSpan={4}>
                Loading…
              </td>
            </tr>
          ) : visibleRows.length === 0 ? (
            <tr role="row">
              <td role="gridcell" colSpan={4}>
                No campaigns
              </td>
            </tr>
          ) : (
            visibleRows.map((row) => {
              const selected = selection.has(row.id);
              return (
                <tr key={row.id} role="row" aria-selected={selected}>
                  <td role="gridcell">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.name}`}
                      checked={selected}
                      onChange={() => setSelection((prev) => withToggled(prev, row.id))}
                    />
                  </td>
                  <td role="gridcell">{row.name}</td>
                  <td role="gridcell">{row.status}</td>
                  <td role="gridcell">{row.updatedAt.slice(0, 10)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="approval-grid__actions">
        <p role="status">{`${selection.size} selected`}</p>
        <button type="button" onClick={approveSelected} disabled={selection.size === 0 || isApproving}>
          Approve selected
        </button>
        {error && <p role="alert">{error}</p>}
      </div>

      <nav className="approval-grid__pager" aria-label="Pagination">
        <button
          type="button"
          onClick={() => navigate({ ...params, page: params.page - 1 })}
          disabled={params.page <= 1}
        >
          Previous
        </button>
        <span>{`Page ${params.page} of ${pageCount}`}</span>
        <button
          type="button"
          onClick={() => navigate({ ...params, page: params.page + 1 })}
          disabled={params.page >= pageCount}
        >
          Next
        </button>
      </nav>
    </div>
  );
}
