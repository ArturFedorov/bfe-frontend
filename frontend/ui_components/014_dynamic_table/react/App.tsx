import DynamicTable from './DynamicTable';

/**
 * Demo harness for Dynamic Table.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Dynamic Table</h2>
      <p className="demo-note">
        Implement <code>DynamicTable</code> in <code>DynamicTable.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <DynamicTable />
      </div>
    </div>
  );
}
