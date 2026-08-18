import { useCallback, useEffect, useRef } from 'react';
import { RenderCounterLab } from './render_counter_lab';

/**
 * Demo harness for the render counter lab — auto-discovered by the playground
 * (playground/App.tsx). The lab ships complete; this harness wires its
 * onRender probe to live per-component counters. Predict the counts in the
 * README first, then click and compare.
 *
 * The counters are painted imperatively (ref + textContent) so the readout
 * itself never causes extra renders of the tree it is measuring.
 */

const IDS = ['app', 'title', 'memo-title', 'panel', 'stable', 'leaf'] as const;

export default function Demo() {
  const counts = useRef<Record<string, number>>({});
  const cells = useRef<Record<string, HTMLElement | null>>({});

  const onRender = useCallback((id: string) => {
    const next = (counts.current[id] ?? 0) + 1;
    counts.current[id] = next;
    const cell = cells.current[id];
    if (cell) cell.textContent = String(next);
  }, []);

  // First render happens before the counter cells exist — sync them after.
  useEffect(() => {
    for (const id of IDS) {
      const cell = cells.current[id];
      if (cell) cell.textContent = String(counts.current[id] ?? 0);
    }
  });

  const reset = () => {
    counts.current = {};
    for (const id of IDS) {
      const cell = cells.current[id];
      if (cell) cell.textContent = '0';
    }
  };

  return (
    <div className="demo">
      <h2>Render Counter Lab</h2>
      <p className="demo-note">
        Nothing to implement — predict the counts in the README, then click &quot;Increment
        app&quot; and &quot;Toggle panel&quot; and watch which counters move. Reset between
        experiments. Note: the playground runs in StrictMode, so every count is doubled versus
        the README&apos;s jest numbers — the ratios still hold.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={reset}>Reset counters</button>
        </div>
        <table style={{ borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr>
              {IDS.map((id) => (
                <th
                  key={id}
                  style={{ border: '1px solid #e5e7eb', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                >
                  {id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {IDS.map((id) => (
                <td
                  key={id}
                  style={{
                    border: '1px solid #e5e7eb',
                    padding: '0.3rem 0.6rem',
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <span
                    ref={(el) => {
                      cells.current[id] = el;
                    }}
                  >
                    0
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <RenderCounterLab onRender={onRender} />
      </div>
    </div>
  );
}
