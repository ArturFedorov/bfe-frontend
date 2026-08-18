import { useState } from 'react';
import { FlexibleInput } from './flexible_input';

/**
 * Demo harness for FlexibleInput — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is flexible_input.test.tsx.
 */
export default function Demo() {
  const [query, setQuery] = useState('pk-104');
  const [lastTyped, setLastTyped] = useState('');

  return (
    <div className="demo">
      <h2>Flexible Input</h2>
      <p className="demo-note">
        Implement <code>FlexibleInput</code> in <code>flexible_input.tsx</code>{' '}
        — controlled when <code>value</code> is passed, uncontrolled with{' '}
        <code>defaultValue</code> otherwise, and a one-time console warning if
        a caller switches modes mid-lifetime.
      </p>
      <div className="demo-stage">
        <h3>Controlled (parent owns the value)</h3>
        <div className="demo-controls">
          <FlexibleInput label="Partner ID" value={query} onChange={setQuery} />
          <button onClick={() => setQuery('pk-104')}>Reset to pk-104</button>
          <button onClick={() => setQuery(query.toUpperCase())}>
            Uppercase from parent
          </button>
        </div>
        <p className="demo-note">Parent state: {query}</p>
      </div>
      <div className="demo-stage">
        <h3>Uncontrolled (defaultValue, input owns itself)</h3>
        <div className="demo-controls">
          <FlexibleInput
            label="Webhook path"
            defaultValue="/hooks/deliveries"
            onChange={setLastTyped}
          />
        </div>
        <p className="demo-note">
          Last onChange value: {lastTyped || '(type to see)'}
        </p>
      </div>
    </div>
  );
}
