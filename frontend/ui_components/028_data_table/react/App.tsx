import DataTable from './DataTable';

/**
 * Demo harness for Data Table with Sort & Filter.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Data Table with Sort & Filter</h2>
      <p className="demo-note">
        Implement <code>DataTable</code> in <code>DataTable.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <DataTable />
      </div>
    </div>
  );
}
