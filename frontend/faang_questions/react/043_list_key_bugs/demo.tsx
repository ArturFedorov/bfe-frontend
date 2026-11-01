import { useCallback, useEffect, useRef } from 'react';
import { TitleList } from './list_key_bugs';

/**
 * Demo harness for the list key bug — auto-discovered by the playground
 * (playground/App.tsx). The shipped TitleList already has per-row note inputs
 * and "Move X down" reorder buttons, which is everything needed to reproduce
 * the bug live; the probe counters show which rows re-render on a swap.
 */

const IDS = ['list', 'row-t-alpha', 'row-t-bravo', 'row-t-charlie'] as const;

export default function Demo() {
  const counts = useRef<Record<string, number>>({});
  const cells = useRef<Record<string, HTMLElement | null>>({});

  const onRender = useCallback((id: string) => {
    const next = (counts.current[id] ?? 0) + 1;
    counts.current[id] = next;
    const cell = cells.current[id];
    if (cell) cell.textContent = String(next);
  }, []);

  useEffect(() => {
    for (const id of IDS) {
      const cell = cells.current[id];
      if (cell) cell.textContent = String(counts.current[id] ?? 0);
    }
  });

  return (
    <div className="demo">
      <h2>List Key Bugs</h2>
      <p className="demo-note">
        Reproduce the bug: type a note into <strong>Alpha</strong>&apos;s input, then click
        &quot;Move Alpha down&quot;. With index keys the note stays behind at the old position —
        it is now on Bravo&apos;s row. Fix the key in <code>list_key_bugs.tsx</code> and repeat:
        the note travels with Alpha, because React now moves the DOM subtree instead of
        repainting labels around stranded inputs.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          {IDS.map((id) => (
            <span key={id} style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {id}:{' '}
              <strong
                ref={(el) => {
                  cells.current[id] = el;
                }}
              >
                0
              </strong>
            </span>
          ))}
        </div>
        <TitleList onRender={onRender} />
      </div>
    </div>
  );
}
