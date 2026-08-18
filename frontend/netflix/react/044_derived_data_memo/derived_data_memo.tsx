import { useState } from 'react';

// TODO: fix the performance problem below
//
// Symptom: toggling "Compact mode" (which has nothing to do with the data)
// re-runs the filter+sort over all 10,000 deliveries. On the real dashboard
// this burns ~20ms per unrelated render.
//
// Rules: derive at render time with useMemo — do NOT copy derived data into
// state (no useEffect + setState mirror; the tests reject useEffect in this
// file). The derivation must run only when its actual inputs change.

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

  // Runs the full 10k-row filter+sort on EVERY render, including renders
  // triggered by state the derivation does not even read.
  onDerive?.();
  const visible = deriveVisible(rows, query, sortKey);

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
