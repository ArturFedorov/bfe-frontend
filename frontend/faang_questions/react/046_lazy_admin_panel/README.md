# 046. Lazy Admin Panel

Difficulty: Medium
Topics: React.lazy, Suspense, code splitting, error boundaries, preloading

## Scenario

The partner dashboard ships a heavy admin panel (charts, editors, permissions grid) that fewer than 1% of sessions ever open — yet its chunk is imported on mount for every visitor, inflating time-to-interactive for everyone. On slow networks the opened panel is a blank slot; when the chunk request fails (deploy rotated the hashed filename), the whole tree crashes with an uncaught `ChunkLoadError`.

This is a **fix-the-code** task (`// TODO: fix the performance problem below` in `lazy_admin_panel.tsx`). Restructure the loader so that:

1. `React.lazy` owns the import and a `<Suspense fallback={<p>Loading admin panel…</p>}>` shows while the chunk is in flight.
2. A class error boundary renders `<p role="alert">Failed to load admin panel</p>` when the import rejects.
3. Hovering "Open admin panel" **preloads** the chunk (import starts before the click).
4. The `loadPanel` factory is never called before the first hover/click, and never more than once — hover-preload and `React.lazy` must share one cached promise (single-flight).

The component receives the import as a prop — `loadPanel: () => Promise<{ default: ComponentType }>` — so tests can inject a controllable deferred and drive resolve/reject deterministically. Treat it exactly like `() => import('./heavy_admin_panel')`.

### Render-count convention

As across Topic 6, the component accepts `onRender?: (id: string) => void` and calls it at the top of the body (`'admin-panel-loader'`). This task's probes are the `loadPanel` spy and the DOM, but keep the convention intact.

## Acceptance Criteria

- Behavior kept: clicking "Open admin panel" eventually shows the panel once the module resolves.
- Mounting the loader calls `loadPanel` **zero** times.
- While the promise is pending after opening, the text "Loading admin panel…" is visible; it disappears once the panel renders.
- Rejecting the promise shows the `role="alert"` error fallback instead of crashing the tree.
- Hover → `loadPanel` called exactly once; unhover/re-hover/click never call it again; the resolved module renders from that single call.

## Example

```tsx
const d = deferred(); // { promise, resolve, reject }
const factory = jest.fn(() => d.promise);
render(<AdminPanelLoader loadPanel={factory} />);
expect(factory).not.toHaveBeenCalled();       // no eager import
await user.hover(screen.getByRole('button', { name: 'Open admin panel' }));
expect(factory).toHaveBeenCalledTimes(1);     // preloaded on hover
```

## Target

Import budget: `loadPanel` invocations per session — mount: **0**; first hover or click: **1**; total, ever: **1**. UX budget: every pending state has visible feedback (Suspense fallback), every failure state has a recovery surface (boundary alert) — no blank slots, no uncaught chunk errors.

## Interviewer follow-up

- Why must the error boundary be a class component? What can `getDerivedStateFromError` do that a hook cannot (today)?
- Where exactly does the single-flight cache live in your fix, and why does `lazy(loadPanel)` alone not deduplicate against a hover preload that calls `loadPanel()` directly?
- `lazy` caches the module forever once resolved — but also caches a REJECTION forever. How would you add a "Retry" button to the error fallback that actually retries the import?
- Preload-on-hover is a heuristic. What other preload triggers would you consider (viewport proximity, route intent, `requestIdleCallback`), and how do you avoid preloading defeating the point of splitting?
- Why does the Suspense boundary belong around just the panel rather than near the app root?
