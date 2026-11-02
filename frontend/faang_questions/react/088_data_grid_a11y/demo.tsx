import { useState } from 'react';
import { DataGrid, type Column, type Row } from './data_grid';

/**
 * Demo harness for DataGrid — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is data_grid.test.tsx.
 */

const ANNOTATORS = ['Priya', 'Marcus', 'Elena', 'Tomasz', 'Aisha', 'Kenji'] as const;
const LABELS = ['Intent', 'Entity', 'Sentiment', 'PII', 'Topic'] as const;
const STATUSES = ['pending', 'approved', 'rejected', 'needs-review'] as const;
const TASKS = [
  'Cancel subscription flow',
  'Billing dispute transcript',
  'Playback buffering report',
  'Subtitle sync complaint',
  'Password reset chat',
  'Office relocation notice',
  'Noise complaint ticket',
  'Gift card spam sample',
] as const;

const ROW_COUNT = 60;

// Deterministic hash so the sample is identical on every reload.
function hash(i: number): number {
  let h = (i + 1) * 2654435761;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return h >>> 0;
}

const ROWS: readonly Row[] = Array.from({ length: ROW_COUNT }, (_, i) => {
  const h = hash(i);
  const day = (h % 28) + 1;
  const month = ((h >>> 5) % 3) + 8; // Aug–Oct
  return {
    id: `r${i + 1}`,
    task: `${TASKS[h % TASKS.length]} #${i + 1}`,
    annotator: ANNOTATORS[(h >>> 3) % ANNOTATORS.length],
    label: LABELS[(h >>> 7) % LABELS.length],
    confidence: Math.round((0.3 + ((h >>> 11) % 700) / 1000) * 100) / 100,
    status: STATUSES[(h >>> 19) % STATUSES.length],
    reviewedAt: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
});

const COLUMNS: readonly Column[] = [
  { key: 'task', header: 'Task', sortable: true, width: 220 },
  { key: 'annotator', header: 'Annotator', sortable: true },
  { key: 'label', header: 'Label' },
  { key: 'confidence', header: 'Confidence', sortable: true, width: 100 },
  { key: 'status', header: 'Status' },
  { key: 'reviewedAt', header: 'Reviewed at' },
];

export default function Demo() {
  const [selection, setSelection] = useState<ReadonlySet<string>>(() => new Set());
  const selectedIds = [...selection];

  return (
    <div className="demo">
      <h2>Data Grid A11y</h2>
      <p className="demo-note">
        Implement <code>nextSortDirection</code>, <code>sortRows</code>,{' '}
        <code>rangeBetween</code> and <code>DataGrid</code> in <code>data_grid.tsx</code>{' '}
        — a <code>role=&quot;grid&quot;</code> with roving tabindex, <code>aria-sort</code>{' '}
        cycling, keyboard/pointer column resize and controlled range selection keyed
        by row id. The fake data is {ROW_COUNT} generated QA rows (task, annotator,
        label, confidence, status, reviewed date) across six columns, three of them
        sortable, paged 10 at a time. Selection lives in this demo and is echoed
        below the grid. Things to try: click a cell, then <kbd>←</kbd>/<kbd>→</kbd>/
        <kbd>↑</kbd>/<kbd>↓</kbd> to move, <kbd>Home</kbd>/<kbd>End</kbd> for the row
        edges, <kbd>PageDown</kbd>/<kbd>PageUp</kbd> to change page keeping the row
        position, <kbd>Space</kbd> on a selection cell to toggle it, and{' '}
        <kbd>Shift</kbd>+click on a checkbox to select the displayed range — sort by
        Confidence first to confirm the range follows the sorted order, not the ids.
        Focus a resize handle and use <kbd>←</kbd>/<kbd>→</kbd> or drag it.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setSelection(new Set())} disabled={selection.size === 0}>
            Clear selection
          </button>
          <span>
            {selection.size} selected: [{selectedIds.join(', ')}]
          </span>
        </div>
        <DataGrid
          rows={ROWS}
          columns={COLUMNS}
          pageSize={10}
          selection={selection}
          onSelectionChange={setSelection}
        />
      </div>
    </div>
  );
}
