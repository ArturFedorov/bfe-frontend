import { useRef, useState } from 'react';
import { RetryPanel } from './retry_panel';

/**
 * Demo harness for RetryPanel — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is retry_panel.test.tsx.
 */

export default function Demo() {
  // Mock connectivity check: fails the first 2 calls, then succeeds — so the
  // backoff (3s → 6s) and the recovery path are both visible.
  const attempts = useRef(0);
  const [scenarioKey, setScenarioKey] = useState(0);

  const runCheck = (): Promise<string> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        attempts.current += 1;
        if (attempts.current <= 2) {
          reject(
            new Error(
              `Connection refused by partner endpoint (attempt ${attempts.current})`
            )
          );
        } else {
          resolve('Partner endpoint healthy — handshake OK');
        }
      }, 600);
    });

  const restart = () => {
    attempts.current = 0;
    setScenarioKey((k) => k + 1);
  };

  return (
    <div className="demo">
      <h2>Retry Panel</h2>
      <p className="demo-note">
        Implement <code>RetryPanel</code> in <code>retry_panel.tsx</code> —
        auto-retry with exponential backoff and a live countdown. The mock
        check fails the first 2 attempts (~600ms each) and then succeeds:
        watch the delay grow 3s → 6s, or smash "Retry now".
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={restart}>Restart scenario</button>
        </div>
        <RetryPanel
          key={scenarioKey}
          runCheck={runCheck}
          initialDelayMs={3000}
          backoffFactor={2}
          maxDelayMs={24000}
        />
      </div>
    </div>
  );
}
