import { useCallback, useEffect, useRef, useState } from 'react';
import { LogViewer } from './virtualized_list';

/**
 * Demo harness for the virtualized list — auto-discovered by the playground
 * (playground/App.tsx). Feeds 50,000 generated log lines into LogViewer. The
 * stub renders nothing (it returns null), so an assignment card shows until
 * you implement the windowing; afterwards you get a 1,000,000px-tall honest
 * scrollbar with at most ~30 real DOM rows at any moment.
 */

const LOGS: string[] = Array.from({ length: 50000 }, (_, i) => {
  const status = ['ok', 'warn', 'stall'][i % 3];
  return `log ${i} — segment=${i % 240} status=${status} bitrate=${3000 + (i % 7) * 250}kbps`;
});

export default function Demo() {
  const total = useRef(0);
  const totalCell = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const onRender = useCallback(() => {
    total.current += 1;
    if (totalCell.current) totalCell.current.textContent = String(total.current);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (totalCell.current) totalCell.current.textContent = String(total.current);
  }, []);

  const implemented = total.current > 0;

  return (
    <div className="demo">
      <h2>Virtualized List</h2>
      <p className="demo-note">
        50,000 log lines, <code>height=400</code>, <code>rowHeight=20</code>,{' '}
        <code>overscan=5</code>. Only the window intersecting the viewport (≤30 rows) may exist
        in the DOM — verify with the element inspector while scrolling. The cumulative counter
        below ticks once per row per render pass; it grows as you scroll but stays tiny compared
        to 50k.
      </p>
      <div className="demo-stage">
        {mounted && !implemented && (
          <p className="demo-note">
            Not implemented yet — <code>LogViewer</code> in <code>virtualized_list.tsx</code>{' '}
            currently renders nothing. Build the windowing (scroll container, spacer, absolutely
            positioned rows) per the README contract and this demo comes alive.
          </p>
        )}
        <div className="demo-controls">
          <span>
            cumulative row renders:{' '}
            <strong
              ref={(el) => {
                totalCell.current = el;
              }}
            >
              0
            </strong>
          </span>
          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
            (50,000 lines · spacer should be 1,000,000px tall)
          </span>
        </div>
        <LogViewer logs={LOGS} height={400} rowHeight={20} overscan={5} onRender={onRender} />
      </div>
    </div>
  );
}
