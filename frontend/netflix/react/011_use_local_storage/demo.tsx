import { useLocalStorage } from './use_local_storage';

/**
 * Demo harness for useLocalStorage — auto-discovered by the playground.
 * Change the settings, refresh the browser tab: they must survive.
 */
function DashboardSettings() {
  const [pageSize, setPageSize] = useLocalStorage<number>('demo.deliveries.pageSize', 25);
  const [collapsed, setCollapsed] = useLocalStorage<boolean>('demo.sidebar.collapsed', false);

  return (
    <div>
      <div className="demo-controls">
        <label>
          Rows per page{' '}
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setCollapsed((prev) => !prev)}>
          Sidebar: {collapsed ? 'collapsed' : 'expanded'} (functional update)
        </button>
      </div>
      <p>
        Persisted: <code>demo.deliveries.pageSize = {JSON.stringify(pageSize)}</code>,{' '}
        <code>demo.sidebar.collapsed = {JSON.stringify(collapsed)}</code>
      </p>
      <div className="demo-controls">
        <button
          onClick={() => window.localStorage.setItem('demo.deliveries.pageSize', 'not-json{{')}
        >
          Corrupt stored value (then refresh — must fall back, not crash)
        </button>
      </div>
    </div>
  );
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>useLocalStorage</h2>
      <p className="demo-note">
        Implement <code>useLocalStorage</code> in{' '}
        <code>use_local_storage.ts</code> — a drop-in <code>useState</code>{' '}
        replacement persisting JSON to localStorage, resilient to corrupt data.
        Change a setting, refresh the page, and it should stick.
      </p>
      <div className="demo-stage">
        <DashboardSettings />
      </div>
    </div>
  );
}
