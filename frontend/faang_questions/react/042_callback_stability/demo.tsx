import { useCallback, useEffect, useRef } from 'react';
import { FilterPanel } from './callback_stability';

/**
 * Demo harness for callback stability — auto-discovered by the playground
 * (playground/App.tsx). Renders the shipped (working-but-slow) panel with its
 * onRender probe wired to per-component counters: before the fix, typing in
 * Search also bumps `category-select`; after the fix it stays frozen.
 *
 * Counters are painted imperatively (ref + textContent) so the readout never
 * re-renders the tree it measures. StrictMode doubles dev counts — watch
 * which counters move, not their absolute values.
 */

const IDS = ['panel', 'search-box', 'category-select', 'result-list'] as const;

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

  const reset = () => {
    counts.current = {};
    for (const id of IDS) {
      const cell = cells.current[id];
      if (cell) cell.textContent = '0';
    }
  };

  return (
    <div className="demo">
      <h2>Callback Stability</h2>
      <p className="demo-note">
        Type in Search and watch the counters: before the fix, the memoized{' '}
        <code>category-select</code> re-renders on every keystroke (and{' '}
        <code>search-box</code> on every category change) because fresh callback/array
        identities defeat the memo boundaries. After the fix, only <code>panel</code>,{' '}
        <code>search-box</code> and <code>result-list</code> move while typing.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          {IDS.map((id) => (
            <span key={id}>
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
          <button onClick={reset}>Reset counters</button>
        </div>
        <FilterPanel onRender={onRender} />
      </div>
    </div>
  );
}
