import { useState } from 'react';
import { TransferList, type TransferItem } from './transfer_list';

/**
 * Demo harness for TransferList — auto-discovered by the playground
 * (playground/App.tsx). Not part of the task: the spec lives in README.md and
 * the grader is transfer_list.test.tsx.
 */

const ASSETS: readonly TransferItem[] = [
  { id: 'as-101', label: 'Northwind S2 — Teaser 15s' },
  { id: 'as-102', label: 'Northwind S2 — Trailer 60s' },
  { id: 'as-103', label: 'Northwind S2 — Recap' },
  { id: 'as-201', label: 'Harbor Lights — Trailer 30s' },
  { id: 'as-202', label: 'Harbor Lights — Behind the scenes' },
  { id: 'as-301', label: 'Quiet Orbit — Teaser 10s' },
  { id: 'as-302', label: 'Quiet Orbit — Trailer 90s' },
  { id: 'as-303', label: 'Quiet Orbit — Cast interview' },
  { id: 'as-401', label: 'Late Shift — Cold open' },
  { id: 'as-402', label: 'Late Shift — Trailer 45s' },
];

export default function Demo() {
  const [value, setValue] = useState<Set<string>>(() => new Set(['as-202', 'as-101']));

  return (
    <div className="demo">
      <h2>Transfer List</h2>
      <p className="demo-note">
        Implement <code>partition</code>, <code>moveIds</code> and <code>TransferList</code> in{' '}
        <code>transfer_list.tsx</code>. Things to verify by hand: clicking highlights without
        moving; typing <code>trailer</code> in the Available filter and pressing{' '}
        <strong>Move all right</strong> moves only the trailers; highlights vanish after a move;
        the right-hand list keeps move order; <kbd>↑</kbd>/<kbd>↓</kbd>, <kbd>Space</kbd>,{' '}
        <kbd>Shift+↓</kbd> and <kbd>Ctrl/⌘+A</kbd> work inside each list.
      </p>
      <div className="demo-stage">
        <TransferList
          items={ASSETS}
          value={value}
          onChange={setValue}
          titles={{ left: 'Available', right: 'Selected' }}
        />
        <p className="demo-note">
          Playlist order: {value.size === 0 ? 'empty' : [...value].join(' → ')}
        </p>
      </div>
    </div>
  );
}
