import { useState } from 'react';

// TODO: fix the performance problem below
//
// Symptom: typing one character into the notes field re-renders all 100
// delivery rows; selecting a row also re-renders all 100. On the real
// dashboard (heavier rows) this makes typing visibly laggy.
//
// Fix by drawing a memo boundary around Row and making every prop that
// crosses it referentially stable. Behavior must not change — the behavior
// tests must stay green; the render-count tests must start passing.

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

function Row({ delivery, isSelected, onSelect, onRender }: RowProps) {
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
}

type DeliveryTableProps = {
  deliveries?: Delivery[];
  onRender?: (id: string) => void;
};

export function DeliveryTable({ deliveries = DELIVERIES, onRender }: DeliveryTableProps) {
  onRender?.('table');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');

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
            onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
            onRender={onRender}
          />
        ))}
      </ul>
    </div>
  );
}
