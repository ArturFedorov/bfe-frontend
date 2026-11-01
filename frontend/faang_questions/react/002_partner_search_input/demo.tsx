import { useState } from 'react';
import { PartnerSearchInput } from './partner_search_input';

/**
 * Demo harness for PartnerSearchInput — auto-discovered by the playground.
 * The parent owns the state; the input only reports changes.
 */
export default function Demo() {
  const [query, setQuery] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');

  return (
    <div className="demo">
      <h2>Partner Search Input</h2>
      <p className="demo-note">
        Implement <code>PartnerSearchInput</code> in{' '}
        <code>partner_search_input.tsx</code> — a fully controlled search box
        with a live character counter and a one-click clear button.
      </p>
      <div className="demo-stage">
        <PartnerSearchInput value={query} onChange={setQuery} />
        <p>
          Parent state: <code>{JSON.stringify(query)}</code>
        </p>
        <PartnerSearchInput
          value={deliveryFilter}
          onChange={setDeliveryFilter}
          label="Filter deliveries"
          maxLength={20}
        />
        <p>
          Parent state: <code>{JSON.stringify(deliveryFilter)}</code>
        </p>
      </div>
    </div>
  );
}
