import { lazy, Suspense, useMemo, useState, type ComponentType } from 'react';

// TODO: fix the performance problem below
//
// Symptom: the admin panel bundle is imported for EVERY user on mount, even
// though <1% ever open it. There is no visible loading fallback (blank slot
// on slow networks), no error fallback (a failed chunk load crashes the
// tree), and hovering the button preloads nothing because the import
// already happened at mount.
//
// Required shape after the fix:
// - React.lazy + <Suspense fallback={<p>Loading admin panel…</p>}>
// - an error boundary rendering <p role="alert">Failed to load admin panel</p>
// - preload on hover of the trigger button
// - `loadPanel` must NOT be called before the user hovers or clicks, and
//   must never be called more than once (single-flight cache shared between
//   the hover preload and React.lazy).

export type PanelModule = { default: ComponentType };

type Props = {
  /** Dynamic-import factory, e.g. () => import('./heavy_admin_panel'). */
  loadPanel: () => Promise<PanelModule>;
  onRender?: (id: string) => void;
};

export function AdminPanelLoader({ loadPanel, onRender }: Props) {
  onRender?.('admin-panel-loader');
  const [open, setOpen] = useState(false);

  // Kicks off the import immediately on mount — every visitor pays for the
  // admin chunk whether or not they ever open the panel.
  const panelPromise = useMemo(() => loadPanel(), [loadPanel]);
  const LazyPanel = useMemo(() => lazy(() => panelPromise), [panelPromise]);

  return (
    <div>
      <button onClick={() => setOpen(true)}>Open admin panel</button>
      {open && (
        <Suspense fallback={null}>
          <LazyPanel />
        </Suspense>
      )}
    </div>
  );
}
