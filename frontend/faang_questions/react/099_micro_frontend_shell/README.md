# 099. Micro-Frontend Shell

**Difficulty:** Hard
**Estimated time:** 60 min
**Topics:** `React.lazy` + `Suspense`, class error boundaries, single-flight module cache, retry after failure, event bus, subscription cleanup, late async resolution after unmount

---

## Scenario

The marketing-automation suite is split into remotes owned by different teams:
Campaigns, Audiences, Templates. The host "shell" renders the navigation, loads
the active remote's bundle on demand, and hands every remote the same props
(`bus`, `user`, `theme`). The first shell re-imported a remote every time the
user navigated back to it, crashed the whole page when one bundle 404ed after
a deploy, and remotes talked to each other through `window` globals that
leaked handlers after unmount — selecting a campaign in one remote kept firing
into a long-gone Audiences screen.

Build `createEventBus()` and `<Shell>`: lazy, cached, retryable remote
loading with per-remote error isolation and a shared typed event bus whose
subscriptions die with the remote that made them.

## Contract

```ts
interface EventBus {
  emit<T>(type: string, payload: T): void;
  on<T>(type: string, handler: (payload: T) => void): () => void; // returns unsubscribe
}
interface RemoteProps { bus: EventBus; user: { id: string; name: string }; theme: 'light' | 'dark' }
interface RemoteManifest {
  id: string;
  name: string;
  route: string;
  load: () => Promise<{ default: ComponentType<RemoteProps> }>;
}

createEventBus(): EventBus

<Shell
  remotes={manifests}
  user={{ id: 'u1', name: 'Jordan' }}
  theme="light"
  initialRoute="/audiences"   // optional; defaults to the first remote's route
  bus={bus}                   // optional; the shell creates one when omitted
/>
```

### DOM shape (the tests query exactly this)

- `<nav aria-label="Micro-frontends">` (role `navigation`) containing one
  `button` per remote whose name is the remote's `name`; the active one has
  `aria-current="page"`.
- While the active remote's module is pending: `<p role="status">Loading <name>…</p>`
  (Suspense fallback — note the `…` character).
- When the module rejects: `<div role="alert">` containing the text
  `<name> failed to load` and a `button` named `Retry`.
- The resolved remote is rendered with `{ bus, user, theme }` as props.

## Requirements

1. **Navigation.** One button per remote; clicking sets the active route. The
   initially active remote is the one whose `route === initialRoute`, else the
   first remote.
2. **Lazy loading with Suspense.** `load` is **not** called for inactive
   remotes. The active remote renders inside `Suspense` with the
   `role="status"` fallback until its module resolves, then renders the
   module's default export with the shared props.
3. **Single-flight cache per remote id.** For a given remote, `load` is called
   once while pending and never again after success — re-rendering the shell,
   clicking the already-active button, or navigating away and back all reuse
   the cached module (`React.lazy` + a `Map` keyed by id, or equivalent).
4. **Error isolation + Retry.** A per-remote class error boundary turns a
   rejected `load` into the `role="alert"` block; the nav and the rest of the
   shell keep working. `Retry` clears that remote's cache entry and calls
   `load` again (a rejected `lazy` is poisoned forever — you must create a
   fresh one). After a successful retry the remote renders normally.
5. **Shared bus.** Every remote receives the same `bus` (the `bus` prop when
   given, otherwise one created once per shell instance). `emit` delivers the
   payload to every handler registered for that type; `on` returns an
   unsubscribe function; emitting a type with no handlers is a no-op;
   unsubscribing twice is safe; a handler added during `emit` is not called
   for that emit.
6. **Subscriptions die with the remote.** A remote subscribes in an effect
   and returns the unsubscribe; after navigating away, an `emit` of that type
   must not reach the unmounted remote's handler.
7. **Late resolution after unmount.** If the shell unmounts while a `load` is
   still pending and the promise later resolves or rejects, nothing throws
   and nothing is logged via `console.error`.

## Acceptance Criteria

- [ ] `createEventBus`: `on` + `emit` deliver the payload; unsubscribe stops
      delivery; two handlers both fire; emit with no handlers does not throw;
      unsubscribing twice is safe.
- [ ] `navigation` role with buttons `Campaigns`, `Audiences`, `Templates`;
      `aria-current="page"` on the active one; `initialRoute` respected;
      defaults to the first remote.
- [ ] Only the active remote's `load` is called on mount.
- [ ] `Loading Campaigns…` (`role="status"`) shows until the module resolves,
      then the remote renders and the fallback is gone.
- [ ] The remote receives `user` and `theme` (renders `Jordan` and `dark`).
- [ ] Clicking the active button again / re-rendering with the same props does
      not call `load` again.
- [ ] Navigating Campaigns → Audiences → Campaigns calls each `load` once.
- [ ] Rejected load → `role="alert"` with `Campaigns failed to load` and a
      `Retry` button; nav still works (switching to Audiences loads it).
- [ ] `Retry` calls `load` a second time; resolving it renders the remote and
      removes the alert.
- [ ] Remote A emitting `campaign:selected` reaches a handler the host
      registered on the shared `bus` prop, with the payload.
- [ ] Senior: remote B subscribes on mount; after navigating to A, an
      `emit('campaign:selected', …)` calls B's handler zero times.
- [ ] Senior: unmount the shell while a load is pending, then resolve it —
      no thrown error and `console.error` is not called.

## Baseline a11y

- Navigation landmark with an accessible name; current remote exposed via
  `aria-current`.
- Loading state announced via `role="status"`; failures via `role="alert"`.
- `Retry` is a real button.

## Constraints

- React only; no module-federation runtime or router library. `load` is just
  a function returning a promise — treat it like `() => import('./remote')`.
- The error boundary must be a class component (`getDerivedStateFromError`).
- The cache lives per shell instance (a ref or state), not at module scope,
  so two shells on one page do not share failures.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- Where should the cache live when remotes also need to be preloaded on hover
  from the nav? How does that interact with `React.lazy`'s own memoization?
- The bus is untyped (`type: string`). Sketch a typed event map
  (`EventMap = { 'campaign:selected': string }`) and what `on`/`emit`
  signatures become.
- A remote's bundle is loaded but its render throws later (not a load
  failure). Should `Retry` re-import or just remount? How do you tell the two
  apart in the boundary?
- Two remotes must be visible at once (a side-panel remote). What changes in
  the cache, the boundary layout and the bus?

## Say out loud

- State shape first: `route: string`, `attempts: Record<id, number>` (bumps
  the boundary `key` on Retry), a `Map<id, LazyExoticComponent>` cache in a
  ref, `bus` created once with `useState(() => createEventBus())`.
- Name the hazard: a rejected `lazy()` caches the rejection forever — Retry
  must delete the cache entry *and* remount the boundary (new `key`) so the
  error state resets.
- Ask one data-shape question: can two manifests share a `route`? Which wins?
- Ask one failure-handling question: should a failing remote auto-retry with
  backoff, or only on explicit user action?
- Name the first test you would write: "navigating away and back calls `load`
  once".
