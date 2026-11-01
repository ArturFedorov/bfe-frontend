import { useState } from 'react';
import { LastUpdatedClock } from './last_updated_clock';

/**
 * Demo harness for LastUpdatedClock — auto-discovered by the playground.
 * "Simulate refresh" pushes a new updatedAt; the label must reset to 0s with
 * no stale-closure leftovers. Unmounting must clear the interval.
 */
export default function Demo() {
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [mounted, setMounted] = useState(true);

  return (
    <div className="demo">
      <h2>Last Updated Clock</h2>
      <p className="demo-note">
        Implement <code>LastUpdatedClock</code> in{' '}
        <code>last_updated_clock.tsx</code> — a self-ticking "Updated Ns ago"
        timer with proper interval cleanup and no stale closures.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setUpdatedAt(Date.now())}>Simulate refresh</button>
          <button onClick={() => setMounted((m) => !m)}>
            {mounted ? 'Unmount card' : 'Mount card'}
          </button>
        </div>
        {mounted && (
          <div className="demo-controls">
            <LastUpdatedClock updatedAt={updatedAt} />
            <LastUpdatedClock updatedAt={updatedAt} tickMs={500} />
          </div>
        )}
      </div>
    </div>
  );
}
