import { useState } from 'react';
import { useDebouncedValue } from './use_debounced_value';

/**
 * Demo harness for useDebouncedValue — auto-discovered by the playground.
 * Type quickly: the live value tracks every keystroke, the debounced value
 * only settles 400ms after you pause.
 */
function PartnerSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  return (
    <div>
      <div className="demo-controls">
        <label>
          Search partners{' '}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="type quickly, then pause"
          />
        </label>
      </div>
      <p>
        Live value: <code>{JSON.stringify(query)}</code>
      </p>
      <p>
        Debounced value (400ms): <code>{JSON.stringify(debouncedQuery)}</code>
      </p>
      <p>
        {query === debouncedQuery
          ? 'Settled — a fetch effect keyed on the debounced value would fire now.'
          : 'Waiting for you to stop typing…'}
      </p>
    </div>
  );
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>useDebouncedValue</h2>
      <p className="demo-note">
        Implement <code>useDebouncedValue</code> in{' '}
        <code>use_debounced_value.ts</code> — a trailing-edge debounced copy of
        any value, with the timer restarted on every change and cleared on
        unmount.
      </p>
      <div className="demo-stage">
        <PartnerSearch />
      </div>
    </div>
  );
}
