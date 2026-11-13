import { useMemo, useRef, useState } from 'react';

// FIXED — the filter+sort is derived at render time inside `useMemo`, keyed on
// exactly the inputs it reads. Derived data never enters state.
//
// Fixes (and why each matters):
// 1. `deriveVisible(rows, query, sortKey)` moved into
//    `useMemo(() => ..., [rows, query, sortKey])`. Previously it ran on EVERY
//    render, including those triggered by `compact`, which the derivation does
//    not read — ~20ms of O(n log n) work over 10k rows for a density toggle.
//    Now a re-render with unchanged inputs returns the cached array (0 work),
//    and a query/sort change recomputes exactly once.
// 2. The `onDerive` probe call lives INSIDE the memo callback so it counts real
//    recomputations, not renders. It is read through a ref (latest-ref pattern)
//    so the deps array stays `[rows, query, sortKey]`: a parent passing a new
//    probe function must not trigger a 10k-row re-sort.
// 3. Deliberately NOT done: mirroring `visible` into `useState` via an effect.
//    That shape renders once with stale data, runs the effect, sets state, and
//    renders again — one extra render per change, plus a window where the UI
//    shows the previous result. State stays three primitives
//    (`query`, `sortKey`, `compact`); the array is a pure function of them.

export type Delivery = {
  id: string;
  title: string;
  eta: number;
};

export const DELIVERIES: Delivery[] = Array.from({ length: 10000 }, (_, i) => ({
  id: `d-${i}`,
  title: `Delivery ${i}`,
  eta: (i * 37) % 1000,
}));

export type SortKey = 'title' | 'eta';

export function deriveVisible(
  rows: Delivery[],
  query: string,
  sortKey: SortKey
): Delivery[] {
  const q = query.toLowerCase();
  // `filter` returns a fresh array, so the in-place `sort` below never mutates
  // the caller's `rows` — important once the result is cached by useMemo.
  const filtered = rows.filter((row) => row.title.toLowerCase().includes(q));
  filtered.sort((a, b) =>
    sortKey === 'eta' ? a.eta - b.eta : a.title.localeCompare(b.title)
  );
  return filtered;
}

type DashboardProps = {
  rows?: Delivery[];
  onRender?: (id: string) => void;
  /** Probe: called once per execution of the filter+sort derivation. */
  onDerive?: () => void;
};

export function DeliveryDashboard({
  rows = DELIVERIES,
  onRender,
  onDerive,
}: DashboardProps) {
  onRender?.('dashboard');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [compact, setCompact] = useState(false);

  // Fix 2: latest-ref so the probe is not a memo dependency.
  const onDeriveRef = useRef(onDerive);
  onDeriveRef.current = onDerive;

  // Fix 1: recompute only when an actual input changes.
  const visible = useMemo(() => {
    onDeriveRef.current?.();
    return deriveVisible(rows, query, sortKey);
  }, [rows, query, sortKey]);

  return (
    <div>
      <label>
        Search
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <label>
        Sort by
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="title">title</option>
          <option value="eta">eta</option>
        </select>
      </label>
      <label>
        Compact mode
        <input
          type="checkbox"
          checked={compact}
          onChange={(e) => setCompact(e.target.checked)}
        />
      </label>
      <p>Density: {compact ? 'compact' : 'comfortable'}</p>
      <p>{visible.length} matches</p>
      <ul>
        {visible.slice(0, 20).map((row) => (
          <li key={row.id}>
            {row.title} — eta {row.eta}
          </li>
        ))}
      </ul>
    </div>
  );
}
