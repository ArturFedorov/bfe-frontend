import { useState } from 'react';
import { useInterval } from './use_interval';

/**
 * Demo harness for useInterval — auto-discovered by the playground.
 * The step selector proves latest-callback semantics: change the step between
 * ticks and the next tick uses the new step without resetting the schedule.
 */
function StatusTile() {
  const [ticks, setTicks] = useState(0);
  const [total, setTotal] = useState(0);
  const [step, setStep] = useState(1);
  const [paused, setPaused] = useState(false);
  const [ms, setMs] = useState(1000);

  useInterval(() => {
    // Closes over the CURRENT step — a stale closure would keep the old one.
    setTicks((t) => t + 1);
    setTotal((v) => v + step);
  }, paused ? null : ms);

  return (
    <div>
      <div className="demo-controls">
        <button onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'} (ms = null)</button>
        <label>
          Period{' '}
          <select value={ms} onChange={(e) => setMs(Number(e.target.value))}>
            {[500, 1000, 2000].map((n) => (
              <option key={n} value={n}>
                {n}ms
              </option>
            ))}
          </select>
        </label>
        <label>
          Step per tick{' '}
          <select value={step} onChange={(e) => setStep(Number(e.target.value))}>
            {[1, 5, 25].map((n) => (
              <option key={n} value={n}>
                +{n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="status">
        Ticks: <strong>{ticks}</strong> — assets polled: <strong>{total}</strong>
        {paused ? ' (paused)' : ''}
      </p>
      <p>
        Change the step mid-flight: the next tick must use the new step and the
        interval schedule must not reset.
      </p>
    </div>
  );
}

export default function Demo() {
  const [mounted, setMounted] = useState(true);

  return (
    <div className="demo">
      <h2>useInterval</h2>
      <p className="demo-note">
        Implement <code>useInterval</code> in <code>use_interval.ts</code> —
        Dan Abramov's latest-callback pattern with <code>ms = null</code> to
        pause, restart on period change, and cleanup on unmount.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setMounted((m) => !m)}>
            {mounted ? 'Unmount tile (interval must clear)' : 'Mount tile'}
          </button>
        </div>
        {mounted && <StatusTile />}
      </div>
    </div>
  );
}
