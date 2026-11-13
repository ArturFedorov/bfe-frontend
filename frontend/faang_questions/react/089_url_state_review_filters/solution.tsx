import { useEffect, useId, useRef, useState, type JSX } from 'react';
import { useUrlState, type UrlSchema } from './use_url_state';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type StatusFilter = 'all' | ReviewStatus;

export type ReviewTask = {
  id: string;
  title: string;
  status: ReviewStatus;
};

/** URL-synced state. Query param names are the keys: `q`, `status`, `page`, `task`. */
export type ReviewFiltersState = {
  q: string;
  status: StatusFilter;
  page: number;
  task: string | null;
};

const KINDS = ['Sentiment', 'NER', 'Intent', 'Toxicity'] as const;
const STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];
const STATUS_FILTERS: StatusFilter[] = ['all', ...STATUSES];

/** Default dataset: 23 tasks, ids `t-1`…`t-23`. */
export const REVIEW_TASKS: ReviewTask[] = Array.from({ length: 23 }, (_, i) => ({
  id: `t-${i + 1}`,
  title: `${KINDS[i % KINDS.length]} batch ${i + 1}`,
  status: STATUSES[i % STATUSES.length],
}));

export type ReviewFiltersProps = {
  tasks?: ReviewTask[];
  /** Rows per page. Default 5. */
  pageSize?: number;
};

const SEARCH_DEBOUNCE_MS = 300;

/** Module-level so the hook sees a stable schema; every `parse` falls back, never throws. */
const schema: UrlSchema<ReviewFiltersState> = {
  q: { parse: (raw) => raw ?? '', serialize: (v) => (v === '' ? null : v), default: '' },
  status: {
    parse: (raw) => (STATUS_FILTERS.includes(raw as StatusFilter) ? (raw as StatusFilter) : 'all'),
    serialize: (v) => v,
    default: 'all',
  },
  page: {
    parse: (raw) => {
      const n = Number(raw);
      return raw !== null && Number.isInteger(n) && n >= 1 ? n : 1;
    },
    serialize: (v) => String(v),
    default: 1,
  },
  task: { parse: (raw) => (raw ? raw : null), serialize: (v) => v, default: null },
};

/**
 * Filterable review queue whose view state lives in the URL.
 *
 * Push vs. replace rule: discrete, intentional changes (status, paging, row
 * selection) push a history entry so Back undoes them; continuous input
 * (typing) is debounced and written with replace so a search leaves one
 * entry at most. The only local state is the raw search `draft`.
 */
export function ReviewFilters({ tasks = REVIEW_TASKS, pageSize = 5 }: ReviewFiltersProps): JSX.Element {
  const ids = useId();
  const [state, setState] = useUrlState(schema);

  // --- search draft (immediate) → URL (debounced, replace) -------------------
  const [draft, setDraft] = useState(state.q);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // When the URL's `q` changes (our own write or Back/Forward), the input shows
  // it and any pending keystroke timer is dropped — a restored value is not typing.
  useEffect(() => {
    clearTimer();
    setDraft(state.q);
  }, [state.q]);

  useEffect(() => clearTimer, []);

  const onSearchChange = (value: string) => {
    setDraft(value);
    clearTimer();
    const committedQ = state.q;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (value === committedQ) return; // nothing to write
      setState({ q: value, page: 1 }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
  };

  // --- derived rows (never stored) --------------------------------------------
  const needle = state.q.toLowerCase();
  const filtered = tasks.filter(
    (t) =>
      (state.status === 'all' || t.status === state.status) && t.title.toLowerCase().includes(needle),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, state.page), pageCount); // clamp for display only
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div>
        <label htmlFor={`${ids}-q`}>Search</label>
        <input id={`${ids}-q`} type="text" value={draft} onChange={(e) => onSearchChange(e.target.value)} />
      </div>

      <div>
        <label htmlFor={`${ids}-status`}>Status</label>
        <select
          id={`${ids}-status`}
          value={state.status}
          onChange={(e) => setState({ status: e.target.value as StatusFilter, page: 1 })}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <p>{`Selected task: ${state.task ?? 'none'}`}</p>

      {rows.length === 0 ? (
        <p>No tasks match</p>
      ) : null}
      <ul role="list" aria-label="Review tasks">
        {rows.map((t) => (
          <li key={t.id}>
            <button type="button" aria-pressed={state.task === t.id} onClick={() => setState({ task: t.id })}>
              {`${t.id} · ${t.title} · ${t.status}`}
            </button>
          </li>
        ))}
      </ul>

      <div>
        <button type="button" disabled={page <= 1} onClick={() => setState({ page: page - 1 })}>
          Previous
        </button>
        <span>{`Page ${page} of ${pageCount}`}</span>
        <button type="button" disabled={page >= pageCount} onClick={() => setState({ page: page + 1 })}>
          Next
        </button>
      </div>
    </div>
  );
}
