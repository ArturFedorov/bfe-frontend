import { memo, useCallback, useState } from 'react';

// FIXED — memo boundary around Row with referentially stable props.
//
// Fixes (and why each matters):
// 1. `Row` is wrapped in `React.memo`. Without a boundary, every re-render of
//    `DeliveryTable` (each notes keystroke) re-renders all 100 rows no matter
//    what their props are — a plain child always follows its parent.
// 2. `onSelect` is created once with `useCallback(..., [])` and uses the
//    FUNCTIONAL update form `setSelectedId((prev) => ...)`. The old inline arrow
//    `(id) => setSelectedId(selectedId === id ? null : id)` was a new function
//    on every render AND closed over `selectedId`, so even `useCallback` with
//    `[selectedId]` deps would have produced a new identity on every selection
//    change, re-rendering all 100 rows. Reading the previous value inside the
//    updater removes the dependency entirely, so the identity never changes.
// 3. Everything else crossing the boundary was already stable: `delivery`
//    objects come from a module-level array (same references each render),
//    `isSelected` is a boolean (compared by value), and `onRender` is the same
//    function instance the caller passes down. So after (1)+(2) the shallow
//    compare passes for every row whose `isSelected` did not flip, giving
//    0 row renders per keystroke and exactly 1 (or 2) per selection change.

export type Delivery = {
  id: string;
  title: string;
  region: string;
};

export const DELIVERIES: Delivery[] = Array.from({ length: 100 }, (_, i) => ({
  id: `d-${i}`,
  title: `Delivery ${i}`,
  region: ['EMEA', 'APAC', 'LATAM', 'NA'][i % 4],
}));

type RowProps = {
  delivery: Delivery;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRender?: (id: string) => void;
};

// Fix 1: memo boundary. Shallow prop comparison now decides whether a row renders.
const Row = memo(function Row({ delivery, isSelected, onSelect, onRender }: RowProps) {
  onRender?.(`row-${delivery.id}`);
  return (
    <li>
      <span>
        {delivery.title} · {delivery.region}
        {isSelected ? ' (selected)' : ''}
      </span>
      <button onClick={() => onSelect(delivery.id)}>Select {delivery.title}</button>
    </li>
  );
});

type DeliveryTableProps = {
  deliveries?: Delivery[];
  onRender?: (id: string) => void;
};

export function DeliveryTable({ deliveries = DELIVERIES, onRender }: DeliveryTableProps) {
  onRender?.('table');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Fix 2: one stable callback for the component's lifetime. The functional
  // updater reads the latest `selectedId` from React, not from a closure, so
  // there is nothing to put in the deps array and the identity never churns.
  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div>
      <label>
        Shift notes
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <p>Note length: {note.length}</p>
      <ul>
        {deliveries.map((delivery) => (
          <Row
            key={delivery.id}
            delivery={delivery}
            isSelected={delivery.id === selectedId}
            onSelect={handleSelect}
            onRender={onRender}
          />
        ))}
      </ul>
    </div>
  );
}
