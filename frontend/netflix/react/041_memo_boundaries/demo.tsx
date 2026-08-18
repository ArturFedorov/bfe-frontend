import { useCallback, useEffect, useRef } from 'react';
import { DeliveryTable } from './memo_boundaries';

/**
 * Demo harness for memo boundaries — auto-discovered by the playground
 * (playground/App.tsx). Renders the shipped (working-but-slow) table with its
 * onRender probe wired to on-screen counters, so you can watch the row-render
 * count stop climbing as you fix the identity churn in memo_boundaries.tsx.
 *
 * Counters are painted imperatively (ref + textContent) so the readout never
 * re-renders the tree it measures. StrictMode doubles dev counts — watch the
 * deltas, not the absolute numbers.
 */
export default function Demo() {
  const counts = useRef({ table: 0, rows: 0 });
  const tableCell = useRef<HTMLElement | null>(null);
  const rowsCell = useRef<HTMLElement | null>(null);

  const paint = useCallback(() => {
    if (tableCell.current) tableCell.current.textContent = String(counts.current.table);
    if (rowsCell.current) rowsCell.current.textContent = String(counts.current.rows);
  }, []);

  const onRender = useCallback(
    (id: string) => {
      if (id.startsWith('row-')) counts.current.rows += 1;
      else counts.current.table += 1;
      paint();
    },
    [paint],
  );

  useEffect(() => {
    paint();
  });

  const reset = () => {
    counts.current = { table: 0, rows: 0 };
    paint();
  };

  return (
    <div className="demo">
      <h2>Memo Boundaries</h2>
      <p className="demo-note">
        Before the fix: every keystroke in &quot;Shift notes&quot; and every selection click adds
        ~100 to the row-render counter. After the fix: typing adds <strong>0</strong> row
        renders, and a selection change adds only the one or two rows whose{' '}
        <code>isSelected</code> flipped.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <span>
            table renders:{' '}
            <strong
              ref={(el) => {
                tableCell.current = el;
              }}
            >
              0
            </strong>
          </span>
          <span>
            row renders (all 100 rows, cumulative):{' '}
            <strong
              ref={(el) => {
                rowsCell.current = el;
              }}
            >
              0
            </strong>
          </span>
          <button onClick={reset}>Reset counters</button>
        </div>
        <DeliveryTable onRender={onRender} />
      </div>
    </div>
  );
}
