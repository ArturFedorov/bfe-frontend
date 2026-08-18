import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminPanelLoader, type PanelModule } from './lazy_admin_panel';

/**
 * Demo harness for the lazy admin panel — auto-discovered by the playground
 * (playground/App.tsx). `loadPanel` wraps a real dynamic import of
 * heavy_panel_demo.tsx behind an artificial 1s delay, plus a failure toggle
 * so you can watch the error-boundary path. The call counter shows the import
 * budget: after the fix it stays at 0 on mount and reaches 1 (per session) on
 * first hover/click — never more.
 */
export default function Demo() {
  const [fail, setFail] = useState(false);
  const failRef = useRef(fail);
  failRef.current = fail;

  const calls = useRef(0);
  const callsCell = useRef<HTMLElement | null>(null);
  const [session, setSession] = useState(0);

  const loadPanel = useCallback((): Promise<PanelModule> => {
    calls.current += 1;
    if (callsCell.current) callsCell.current.textContent = String(calls.current);
    const shouldFail = failRef.current;
    return new Promise<PanelModule>((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Simulated chunk load failure (deploy rotated the hashed filename)'));
          return;
        }
        import('./heavy_panel_demo').then(resolve, reject);
      }, 1000);
    });
  }, []);

  useEffect(() => {
    if (callsCell.current) callsCell.current.textContent = String(calls.current);
  });

  return (
    <div className="demo">
      <h2>Lazy Admin Panel</h2>
      <p className="demo-note">
        Before the fix, the counter jumps on mount — every visitor pays for the chunk. After the
        fix: mount calls <code>loadPanel</code> 0 times, hovering &quot;Open admin panel&quot;
        preloads it exactly once, and clicking shows &quot;Loading admin panel…&quot; until the
        1s import resolves. Turn on the failure toggle and remount to exercise the{' '}
        <code>role=&quot;alert&quot;</code> error boundary instead of a crash. (StrictMode may
        double the pre-fix mount count; the fixed version stays at 0.)
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <span>
            loadPanel calls (all sessions):{' '}
            <strong
              ref={(el) => {
                callsCell.current = el;
              }}
            >
              0
            </strong>
          </span>
          <label>
            <input
              type="checkbox"
              checked={fail}
              onChange={(e) => setFail(e.target.checked)}
            />{' '}
            Simulate load failure
          </label>
          <button onClick={() => setSession((s) => s + 1)}>
            Remount loader (fresh session)
          </button>
        </div>
        <p className="demo-note">
          The failure toggle applies to the <em>next</em> <code>loadPanel</code> call — since a
          resolved or rejected chunk is cached forever, remount the loader to try again.
        </p>
        <AdminPanelLoader key={session} loadPanel={loadPanel} />
      </div>
    </div>
  );
}
