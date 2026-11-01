import {
  PaginatedTable,
  Delivery,
  FetchPageParams,
  PageResult,
} from './paginated_table';

/**
 * Demo harness for PaginatedTable — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is paginated_table.test.tsx.
 */

const TITLES = [
  'Stranger Assets S5',
  'Nordic Noir E01–E08',
  'Sakura Feature 4K',
  'Meridian Docuseries',
  'Acme Pilot Cut',
  'Wichita Western Pack',
  'Baltic Crime Bundle',
  'Andes Nature Special',
];

const STATUSES: Delivery['status'][] = ['delivered', 'processing', 'failed'];

// ~40 deliveries held "server-side"; fetchPage filters and slices with latency.
const ALL_DELIVERIES: Delivery[] = Array.from({ length: 40 }, (_, i) => ({
  id: `dlv-${String(i + 1).padStart(3, '0')}`,
  title: `${TITLES[i % TITLES.length]} · drop ${i + 1}`,
  status: STATUSES[i % STATUSES.length],
}));

function fetchPage({ page, pageSize, status }: FetchPageParams): Promise<PageResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered =
        status === 'all'
          ? ALL_DELIVERIES
          : ALL_DELIVERIES.filter((d) => d.status === status);
      const start = (page - 1) * pageSize;
      resolve({
        rows: filtered.slice(start, start + pageSize),
        total: filtered.length,
      });
    }, 300 + Math.random() * 500);
  });
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>Paginated Table</h2>
      <p className="demo-note">
        Implement <code>PaginatedTable</code> in <code>paginated_table.tsx</code>{' '}
        — server pagination over a mock API holding 40 deliveries
        (300–800ms latency). Changing the status filter must reset to page 1,
        and out-of-order responses must never overwrite newer ones.
      </p>
      <div className="demo-stage">
        <PaginatedTable fetchPage={fetchPage} pageSize={7} />
      </div>
    </div>
  );
}
