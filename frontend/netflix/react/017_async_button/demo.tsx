import { AsyncButton } from './async_button';

/**
 * Demo harness for AsyncButton — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is async_button.test.tsx.
 */

// Mock sync API: ~600ms latency, fails randomly ~30% of the time so the
// error + retry path is easy to reproduce.
function triggerSync(): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.3) {
        reject(new Error('Partner pipeline unavailable'));
      } else {
        resolve();
      }
    }, 600);
  });
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>Async Button</h2>
      <p className="demo-note">
        Implement <code>AsyncButton</code> in <code>async_button.tsx</code> —
        pending label while the promise is in flight, double-submit guard, and
        an announced error on rejection. The mock sync below takes ~600ms and
        fails randomly about 30% of the time, so keep clicking to see the
        error path.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <AsyncButton label="Sync now" onSync={triggerSync} />
          <AsyncButton
            label="Re-run QC"
            pendingLabel="Running QC…"
            errorMessage="QC run failed. Try again."
            onSync={triggerSync}
          />
        </div>
      </div>
    </div>
  );
}
