import { useRef, useState } from 'react';
import { PollingStatusWidget, IngestionStatus } from './polling_status_widget';

/**
 * Demo harness for PollingStatusWidget — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is polling_status_widget.test.tsx.
 */

export default function Demo() {
  // Mock ingestion API: queued → processing ×3 (with one dropped connection
  // in the middle to show the error backoff) → succeeded (terminal).
  const polls = useRef(0);
  const [runKey, setRunKey] = useState(0);

  const fetchStatus = (): Promise<IngestionStatus> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        polls.current += 1;
        const n = polls.current;
        if (n === 1) resolve('queued');
        else if (n === 3) reject(new Error('gateway timeout'));
        else if (n < 6) resolve('processing');
        else resolve('succeeded');
      }, 400 + Math.random() * 300);
    });

  const restart = () => {
    polls.current = 0;
    setRunKey((k) => k + 1);
  };

  return (
    <div className="demo">
      <h2>Polling Status Widget</h2>
      <p className="demo-note">
        Implement <code>PollingStatusWidget</code> in{' '}
        <code>polling_status_widget.tsx</code> — settle-then-schedule polling
        with error backoff and a terminal stop. The mock ingestion goes queued
        → processing (one poll drops mid-run to show the backoff) →
        succeeded; polls every 2s, backoff capped at 8s.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={restart}>Restart ingestion</button>
        </div>
        <PollingStatusWidget
          key={runKey}
          fetchStatus={fetchStatus}
          intervalMs={2000}
          maxIntervalMs={8000}
        />
      </div>
    </div>
  );
}
