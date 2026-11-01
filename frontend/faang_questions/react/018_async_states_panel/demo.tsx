import { useEffect, useRef, useState } from 'react';
import { AsyncStatesPanel, AsyncResult, Partner } from './async_states_panel';

/**
 * Demo harness for AsyncStatesPanel — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is async_states_panel.test.tsx.
 */

const PARTNERS: Partner[] = [
  { id: 'p1', name: 'Acme Studios' },
  { id: 'p2', name: 'Nordic Films' },
  { id: 'p3', name: 'Sakura Animation' },
  { id: 'p4', name: 'Meridian Pictures' },
];

type Scenario = 'success' | 'empty' | 'error';

// Mock partner API: ~500ms latency, outcome picked by the scenario buttons.
function fetchPartners(scenario: Scenario): Promise<Partner[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (scenario === 'error') {
        reject(new Error('Upstream timeout while listing partners'));
      } else {
        resolve(scenario === 'empty' ? [] : PARTNERS);
      }
    }, 500);
  });
}

export default function Demo() {
  const [scenario, setScenario] = useState<Scenario>('success');
  const [result, setResult] = useState<AsyncResult<Partner>>({
    status: 'loading',
  });
  const requestId = useRef(0);

  const load = (next: Scenario) => {
    const id = ++requestId.current;
    setScenario(next);
    setResult({ status: 'loading' });
    fetchPartners(next)
      .then((data) => {
        if (requestId.current === id) setResult({ status: 'success', data });
      })
      .catch((error: Error) => {
        if (requestId.current === id) setResult({ status: 'error', error });
      });
  };

  useEffect(() => {
    load('success');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="demo">
      <h2>Async States Panel</h2>
      <p className="demo-note">
        Implement <code>AsyncStatesPanel</code> in{' '}
        <code>async_states_panel.tsx</code> — one discriminated-union result,
        one rendered state. Use the buttons to replay each fetch outcome
        (~500ms latency); Retry re-runs the current scenario.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => load('success')}>Load partners</button>
          <button onClick={() => load('empty')}>Simulate empty</button>
          <button onClick={() => load('error')}>Simulate error</button>
        </div>
        <AsyncStatesPanel result={result} onRetry={() => load(scenario)} />
      </div>
    </div>
  );
}
