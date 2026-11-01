import { Component, memo, useRef, type ReactNode } from 'react';
import {
  DashboardProvider,
  LaggyDashboardProvider,
  useDashboardDispatch,
  useDashboardState,
  useLaggyDashboard,
} from './context_splitting';

/**
 * Demo harness for context splitting — auto-discovered by the playground
 * (playground/App.tsx). Both versions are mounted side by side with visible
 * render counters: on the laggy side the memoized toolbar re-renders on every
 * state change; once you implement the split provider, the fixed toolbar's
 * counter freezes while its state panel keeps updating.
 *
 * Note: the playground runs in StrictMode, so dev render counts are doubled —
 * compare which counters MOVE, not their absolute values.
 */

function RenderCount({ count }: { count: number }) {
  return (
    <span
      style={{
        background: '#fef3c7',
        borderRadius: 4,
        padding: '0.1rem 0.4rem',
        fontSize: '0.75rem',
        color: '#92400e',
      }}
    >
      renders: {count}
    </span>
  );
}

// --- Laggy baseline (works out of the box) --------------------------------

const LaggyStatePanel = memo(function LaggyStatePanel() {
  const renders = useRef(0);
  renders.current += 1;
  const { state } = useLaggyDashboard();
  return (
    <p>
      refreshCount: <strong>{state.refreshCount}</strong> · region:{' '}
      <strong>{state.region}</strong> <RenderCount count={renders.current} />
    </p>
  );
});

const LaggyToolbar = memo(function LaggyToolbar() {
  const renders = useRef(0);
  renders.current += 1;
  const { dispatch } = useLaggyDashboard();
  return (
    <div className="demo-controls">
      <button onClick={() => dispatch({ type: 'refresh' })}>Refresh</button>
      <button onClick={() => dispatch({ type: 'setRegion', region: 'emea' })}>EMEA</button>
      <button onClick={() => dispatch({ type: 'setRegion', region: 'all' })}>All regions</button>
      <RenderCount count={renders.current} />
    </div>
  );
});

// --- Split version (throws until DashboardProvider is implemented) ---------

const SplitStatePanel = memo(function SplitStatePanel() {
  const renders = useRef(0);
  renders.current += 1;
  const state = useDashboardState();
  return (
    <p>
      refreshCount: <strong>{state.refreshCount}</strong> · region:{' '}
      <strong>{state.region}</strong> <RenderCount count={renders.current} />
    </p>
  );
});

const SplitToolbar = memo(function SplitToolbar() {
  const renders = useRef(0);
  renders.current += 1;
  const dispatch = useDashboardDispatch();
  return (
    <div className="demo-controls">
      <button onClick={() => dispatch({ type: 'refresh' })}>Refresh</button>
      <button onClick={() => dispatch({ type: 'setRegion', region: 'emea' })}>EMEA</button>
      <button onClick={() => dispatch({ type: 'setRegion', region: 'all' })}>All regions</button>
      <RenderCount count={renders.current} />
    </div>
  );
});

// Local boundary so the laggy baseline stays visible while the split version
// is still unimplemented. Demo plumbing only — not part of the task.
class SplitBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <p className="demo-note">
          Not implemented yet — build <code>DashboardProvider</code>,{' '}
          <code>useDashboardState</code> and <code>useDashboardDispatch</code> to light this
          column up. ({this.state.error.message})
        </p>
      );
    }
    return this.props.children;
  }
}

const columnStyle = {
  flex: 1,
  minWidth: '18rem',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '1rem',
} as const;

export default function Demo() {
  return (
    <div className="demo">
      <h2>Context Splitting</h2>
      <p className="demo-note">
        Both toolbars only ever <em>dispatch</em> and are wrapped in <code>React.memo</code>.
        Click Refresh a few times on each side: the laggy toolbar&apos;s render counter climbs
        with every state change; after you implement the split provider, the fixed toolbar&apos;s
        counter stays frozen while its state panel keeps re-rendering.
      </p>
      <div className="demo-stage" style={{ maxWidth: '64rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={columnStyle}>
            <h3 style={{ marginTop: 0 }}>Laggy: one {'{ state, dispatch }'} context</h3>
            <LaggyDashboardProvider>
              <LaggyStatePanel />
              <LaggyToolbar />
            </LaggyDashboardProvider>
          </div>
          <div style={columnStyle}>
            <h3 style={{ marginTop: 0 }}>Fixed: split state / dispatch contexts</h3>
            <SplitBoundary>
              <DashboardProvider>
                <SplitStatePanel />
                <SplitToolbar />
              </DashboardProvider>
            </SplitBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
