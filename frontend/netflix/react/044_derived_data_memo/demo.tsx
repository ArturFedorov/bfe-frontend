import { useCallback, useEffect, useRef } from 'react';
import { DELIVERIES, DeliveryDashboard } from './derived_data_memo';

/**
 * Demo harness for derived-data memoization — auto-discovered by the
 * playground (playground/App.tsx). Renders the shipped dashboard over the 10k
 * generated rows with both probes wired to visible counters: before the fix,
 * toggling "Compact mode" bumps the derivation count; after the fix, only
 * query/sort changes do.
 *
 * Counters are painted imperatively (ref + textContent) so the readout never
 * re-renders the tree it measures. StrictMode doubles dev counts.
 */
export default function Demo() {
  const counts = useRef({ renders: 0, derives: 0 });
  const rendersCell = useRef<HTMLElement | null>(null);
  const derivesCell = useRef<HTMLElement | null>(null);

  const paint = useCallback(() => {
    if (rendersCell.current) rendersCell.current.textContent = String(counts.current.renders);
    if (derivesCell.current) derivesCell.current.textContent = String(counts.current.derives);
  }, []);

  const onRender = useCallback(() => {
    counts.current.renders += 1;
    paint();
  }, [paint]);

  const onDerive = useCallback(() => {
    counts.current.derives += 1;
    paint();
  }, [paint]);

  useEffect(() => {
    paint();
  });

  const reset = () => {
    counts.current = { renders: 0, derives: 0 };
    paint();
  };

  return (
    <div className="demo">
      <h2>Derived Data Memo</h2>
      <p className="demo-note">
        The dashboard filters and sorts 10,000 rows. Toggle &quot;Compact mode&quot; a few times:
        before the fix, every toggle re-runs the full derivation (derivation counter climbs with
        the render counter — and the page hitches). After the <code>useMemo</code> fix, unrelated
        renders add <strong>0</strong> derivations; only query and sort changes derive.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <span>
            dashboard renders:{' '}
            <strong
              ref={(el) => {
                rendersCell.current = el;
              }}
            >
              0
            </strong>
          </span>
          <span>
            derivations (10k-row filter+sort):{' '}
            <strong
              ref={(el) => {
                derivesCell.current = el;
              }}
            >
              0
            </strong>
          </span>
          <button onClick={reset}>Reset counters</button>
        </div>
        <DeliveryDashboard rows={DELIVERIES} onRender={onRender} onDerive={onDerive} />
      </div>
    </div>
  );
}
