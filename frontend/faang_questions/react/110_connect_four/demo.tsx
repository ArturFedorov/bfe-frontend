import { useState } from 'react';
import { ConnectFour } from './connect_four';

/**
 * Demo harness for Connect Four — auto-discovered by the playground
 * (playground/App.tsx). Not part of the task: the spec lives in README.md and
 * the grader is connect_four.test.tsx. The size picker remounts the board.
 */

const SIZES = [
  { label: '6 × 7 (standard)', rows: 6, cols: 7 },
  { label: '5 × 6', rows: 5, cols: 6 },
  { label: '4 × 4 (quick draw)', rows: 4, cols: 4 },
];

export default function Demo() {
  const [size, setSize] = useState(0);
  const { rows, cols } = SIZES[size];

  return (
    <div className="demo">
      <h2>Connect Four</h2>
      <p className="demo-note">
        Implement <code>createBoard</code>, <code>drop</code>, <code>undo</code>,{' '}
        <code>checkWinner</code>, <code>winningCells</code> and <code>ConnectFour</code> in{' '}
        <code>connect_four.tsx</code>. Click a column header or focus the grid and use{' '}
        <kbd>←</kbd> / <kbd>→</kbd> + <kbd>Enter</kbd>. Winning cells get a <code>data-winning</code>{' '}
        attribute (styled below), <code>Undo</code> takes a move back even after a win, and the status
        line is the only live region.
      </p>
      <div className="demo-stage">
        <style>{`
          .c4 [role="grid"] { display: inline-block; padding: 0.5rem; background: #1d4ed8; border-radius: 8px; outline-offset: 2px; }
          .c4 [role="row"] { display: flex; gap: 4px; margin-bottom: 4px; }
          .c4 [role="columnheader"] { width: 2.5rem; height: 1.75rem; border: 0; border-radius: 4px; background: #bfdbfe; cursor: pointer; }
          .c4 [role="columnheader"][aria-selected="true"] { background: #fde047; }
          .c4 [role="columnheader"]:disabled { opacity: 0.4; cursor: not-allowed; }
          .c4 [role="gridcell"] { width: 2.5rem; height: 2.5rem; border-radius: 50%; background: #eff6ff; display: grid; place-items: center; font-size: 1.6rem; line-height: 1; }
          .c4 [role="gridcell"][aria-label$="Player 1"] { background: #ef4444; color: #ef4444; }
          .c4 [role="gridcell"][aria-label$="Player 2"] { background: #facc15; color: #facc15; }
          .c4 [role="gridcell"][data-winning] { box-shadow: inset 0 0 0 4px #111827; }
          .c4 [role="status"] { font-weight: 600; margin: 0.5rem 0; }
        `}</style>
        <div className="demo-controls">
          <label>
            Board size{' '}
            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {SIZES.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="c4" style={{ marginTop: '1rem' }}>
          <ConnectFour key={`${rows}x${cols}`} rows={rows} cols={cols} />
        </div>
      </div>
    </div>
  );
}
