import { useState } from 'react';
import { KanbanBoard, type Board } from './kanban_board';

/**
 * Demo harness for KanbanBoard — auto-discovered by the playground
 * (playground/App.tsx). Not part of the task: the spec lives in README.md and
 * the grader is kanban_board.test.tsx.
 */

const INITIAL: Board = {
  columns: [
    { id: 'review', title: 'To review', cardIds: ['a1', 'a2', 'a3', 'a4'] },
    { id: 'qc', title: 'In QC', cardIds: ['a5', 'a6'] },
    { id: 'approved', title: 'Approved', cardIds: ['a7'] },
  ],
  cards: {
    a1: { id: 'a1', title: 'Northwind S2 — Teaser 15s' },
    a2: { id: 'a2', title: 'Northwind S2 — Trailer 60s' },
    a3: { id: 'a3', title: 'Harbor Lights — Recap' },
    a4: { id: 'a4', title: 'Quiet Orbit — Cold open' },
    a5: { id: 'a5', title: 'Late Shift — Trailer 45s' },
    a6: { id: 'a6', title: 'Quiet Orbit — Cast interview' },
    a7: { id: 'a7', title: 'Harbor Lights — Trailer 30s' },
  },
};

export default function Demo() {
  const [board, setBoard] = useState(INITIAL);
  const [changes, setChanges] = useState(0);

  return (
    <div className="demo">
      <h2>Kanban Board</h2>
      <p className="demo-note">
        Implement <code>moveCard</code>, <code>reorderColumn</code> and <code>KanbanBoard</code> in{' '}
        <code>kanban_board.tsx</code>. Things to verify by hand: press <strong>Move</strong> on a
        card, steer with <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> (the card previews
        in place and the status line narrates), <kbd>Enter</kbd> commits, <kbd>Escape</kbd>{' '}
        restores; drag a card with the pointer onto another column; dropping it back where it
        was must not bump the change counter.
      </p>
      <div className="demo-stage">
        <KanbanBoard
          value={board}
          onChange={(next) => {
            setBoard(next);
            setChanges((n) => n + 1);
          }}
        />
        <p className="demo-note">
          onChange calls: {changes} ·{' '}
          {board.columns.map((c) => `${c.title}: ${c.cardIds.length}`).join(' · ')}
        </p>
      </div>
    </div>
  );
}
