import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useRef,
  useState,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';

// FIXED — on-demand, single-flight, lazy-loaded admin panel.
//
// Fixes (and why each matters):
// 1. No import on mount. The old `useMemo(() => loadPanel(), [loadPanel])`
//    started the chunk request for every visitor. Now the import is started
//    only by `ensureLoaded()`, which runs on hover/focus (preload) or when
//    React.lazy first renders the panel after a click.
// 2. Single-flight cache. `ensureLoaded` stores the promise in a ref
//    (`panelPromiseRef`) and returns the same promise on every later call.
//    `lazy(loadPanel)` alone would NOT dedupe against a hover preload that
//    calls `loadPanel()` directly — they would be two separate promises and two
//    network requests. Routing both through one cached promise fixes that.
// 3. Visible pending state. `<Suspense fallback={<p>Loading admin panel…</p>}>`
//    replaces the `fallback={null}` blank slot.
// 4. Recoverable failure. A class error boundary (`getDerivedStateFromError`
//    has no hook equivalent) catches the rejected import that React.lazy
//    rethrows during render, and shows `<p role="alert">Failed to load admin
//    panel</p>` plus a Retry. Retry clears the cached (rejected) promise and
//    re-creates the lazy component, because `lazy` caches a rejection forever.
// 5. The Suspense/error boundary wraps only the panel, so a slow or failed
//    chunk never blanks or crashes the rest of the dashboard.

export type PanelModule = { default: ComponentType };

type Props = {
  /** Dynamic-import factory, e.g. () => import('./heavy_admin_panel'). */
  loadPanel: () => Promise<PanelModule>;
  onRender?: (id: string) => void;
};

type BoundaryProps = { onRetry: () => void; children: ReactNode };
type BoundaryState = { hasError: boolean };

/** Fix 4: class component — the only way to catch render-phase errors today. */
class PanelErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Hook for real error reporting; kept minimal here.
    void error;
    void info;
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div>
          <p role="alert">Failed to load admin panel</p>
          <button type="button" onClick={this.props.onRetry}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AdminPanelLoader({ loadPanel, onRender }: Props) {
  onRender?.('admin-panel-loader');
  const [open, setOpen] = useState(false);

  // Latest-ref so inline `loadPanel` props do not re-create anything.
  const loadPanelRef = useRef(loadPanel);
  loadPanelRef.current = loadPanel;

  // Fix 2: the single-flight cache. `null` until the first hover/click.
  const panelPromiseRef = useRef<Promise<PanelModule> | null>(null);
  const ensureLoaded = useCallback((): Promise<PanelModule> => {
    if (!panelPromiseRef.current) {
      panelPromiseRef.current = loadPanelRef.current();
    }
    return panelPromiseRef.current;
  }, []);

  // Fix 1: React.lazy's factory goes through the cache, so a preload that
  // already started is reused instead of importing again. Created once per
  // instance (lazy init) — creating a lazy component during every render would
  // remount the panel each time. `attempt` lets Retry build a fresh one.
  const [attempt, setAttempt] = useState(0);
  const [LazyPanel, setLazyPanel] = useState(() => lazy(ensureLoaded));

  const retry = useCallback(() => {
    panelPromiseRef.current = null; // drop the cached rejection
    setLazyPanel(() => lazy(ensureLoaded));
    setAttempt((n) => n + 1); // remount the boundary so it clears hasError
  }, [ensureLoaded]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={ensureLoaded} // Fix: preload on hover …
        onFocus={ensureLoaded} // … and on keyboard focus, for parity
      >
        Open admin panel
      </button>
      {open && (
        <PanelErrorBoundary key={attempt} onRetry={retry}>
          {/* Fix 3: visible pending state */}
          <Suspense fallback={<p>Loading admin panel…</p>}>
            <LazyPanel />
          </Suspense>
        </PanelErrorBoundary>
      )}
    </div>
  );
}
