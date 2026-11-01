import { useState } from 'react';
import { useAsync } from './use_async';

/**
 * Demo harness for useAsync — auto-discovered by the playground.
 * "Trigger sync" hits a mock API with random 300–800ms latency and a ~30%
 * failure rate. Double-click fast: only the LATEST run may settle into state.
 */
interface SyncResult {
  partnerId: string;
  assetsSynced: number;
  finishedAt: string;
}

let syncCounter = 0;

function triggerSync(partnerId: string): Promise<SyncResult> {
  const runNumber = ++syncCounter;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.3) {
        reject(new Error(`Sync #${runNumber} failed: upstream timeout for ${partnerId}`));
        return;
      }
      resolve({
        partnerId,
        assetsSynced: 40 + Math.floor(Math.random() * 200),
        finishedAt: new Date().toLocaleTimeString(),
      });
    }, 300 + Math.random() * 500);
  });
}

function SyncNowButton() {
  const [partnerId, setPartnerId] = useState('p-100');
  const { status, data, error, run } = useAsync(() => triggerSync(partnerId));

  return (
    <div>
      <div className="demo-controls">
        <label>
          Partner{' '}
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            {['p-100', 'p-200', 'p-300'].map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => run()}>
          {status === 'loading' ? 'Syncing…' : 'Trigger sync'}
        </button>
        <span>
          status: <code>{status}</code>
        </span>
      </div>
      {status === 'success' && data && (
        <p>
          Synced <strong>{data.assetsSynced}</strong> assets for{' '}
          <code>{data.partnerId}</code> at {data.finishedAt}.
        </p>
      )}
      {status === 'error' && <p role="alert">{error?.message}</p>}
      <p>
        The button is intentionally NOT disabled while loading — click it twice
        fast and verify the first (stale) run never overwrites the second.
      </p>
    </div>
  );
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>useAsync</h2>
      <p className="demo-note">
        Implement <code>useAsync</code> in <code>use_async.ts</code> — an
        idle/loading/success/error state machine around any promise-returning
        function where only the latest run may settle into state. The mock sync
        API fails about 30% of the time.
      </p>
      <div className="demo-stage">
        <SyncNowButton />
      </div>
    </div>
  );
}
