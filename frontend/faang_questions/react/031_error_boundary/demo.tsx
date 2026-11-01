import { useState } from 'react';
import { ErrorBoundary } from './error_boundary';

/**
 * Demo harness for ErrorBoundary — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is error_boundary.test.tsx.
 */

// A dashboard widget that throws during render when the record is broken.
function PartnerHealthWidget({ broken }: { broken: boolean }) {
  if (broken) {
    throw new Error('Malformed partner record: missing delivery manifest');
  }
  return <p>Partner Acme Studios: all 14 integrations healthy.</p>;
}

export default function Demo() {
  const [broken, setBroken] = useState(false);

  return (
    <div className="demo">
      <h2>Error Boundary</h2>
      <p className="demo-note">
        Implement <code>ErrorBoundary</code> in <code>error_boundary.tsx</code>{' '}
        — a class boundary with a render-prop fallback and a{' '}
        <code>reset</code> escape hatch. Toggle "Break it" to make the widget
        throw during render, then recover with "Try again" in the fallback.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setBroken(true)}>Break it</button>
        </div>
        <ErrorBoundary
          onError={(error) => console.error('[demo] boundary caught:', error)}
          fallback={({ error, reset }) => (
            <div role="alert">
              <p>Widget failed: {error.message}</p>
              <button
                onClick={() => {
                  setBroken(false);
                  reset();
                }}
              >
                Try again
              </button>
            </div>
          )}
        >
          <PartnerHealthWidget broken={broken} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
