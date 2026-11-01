# 090. Mini Store with useSyncExternalStore

**Difficulty:** Hard
**Estimated time:** 60 min
**Topics:** useSyncExternalStore, external stores, selectors, tearing, batching, render budgets

---

## Scenario

The annotation workspace shows one task in several panels at once: the label palette, the
span list, the QA sidebar, and the agent-suggestion tray all read from the same review state
(selected task, label count, active filters, current selection range). The panels live in
different subtrees, so the team reached for a module-level store instead of prop drilling.

Their first store was `useState` + `useEffect(() => subscribe(...))` in every panel. It
re-rendered every panel on every change, briefly showed a selection whose `start` and `end`
came from two different updates, and leaked subscriptions when panels were hidden. Build a
small, correct store primitive: `createStore` plus a selector-based `useStore` built on
`React.useSyncExternalStore`.

## Requirements

1. `createStore<S>(initial)` returns `{ getState, setState, subscribe, batch, listenerCount }`
   (full types in `mini_store.ts`). `getState()` returns the current state object; the object
   is replaced, never mutated, on each update.
2. `setState(partial | (state) => partial)` shallow-merges into the state (nested objects are
   replaced, not deep-merged) and notifies every subscriber **synchronously, exactly once per
   call**. Listeners observe the new state when they run.
3. `subscribe(listener)` returns an idempotent unsubscribe. `listenerCount()` reports active
   subscribers. A listener that unsubscribes during notification must not break the others.
4. `batch(fn)` applies `setState` calls inside `fn` immediately to the state (so `getState()`
   inside the batch sees them) but defers notification until the **outermost** batch finishes:
   N `setState`s → 1 notification. Nested batches notify once. An empty batch notifies zero
   times. If `fn` throws, the error propagates, the pending notification still flushes, and the
   store remains usable (depth counter reset).
5. `shallowEqual(a, b)` — one level of own keys, `Object.is` per value and for non-objects.
6. `useStore(store, selector, equalityFn = Object.is)` is built on `useSyncExternalStore` and
   passes a `getServerSnapshot` so the component renders with `renderToString`. The hook must
   return a cached snapshot when the selected slice is "equal" according to `equalityFn`
   (otherwise React re-renders every notification and, for fresh object slices, loops).
7. A component re-renders **only** when its selected slice changes. Two components selecting
   different slices are independent. Writing the same value again does not re-render.
8. A changed selector (e.g. one that closes over a prop) must yield the new slice on the next
   render even if the store did not change.
9. Unsubscribe on unmount — `listenerCount()` returns to 0.
10. No tearing: a selector reading two fields written in one `setState` (or one `batch`) never
    observes a half-updated pair, including when the update is wrapped in `startTransition`.
11. No `useEffect`/`useState` subscription plumbing in `mini_store.ts` — the static test rejects it.

## Acceptance criteria

- [ ] `getState` returns the initial object; partial and functional `setState` merge shallowly
      and do not mutate the previous object.
- [ ] Subscribers are notified synchronously once per `setState` and see the new state.
- [ ] Unsubscribe is idempotent; `listenerCount` tracks it; unsubscribing during notify is safe.
- [ ] `batch`: 3 setStates → 1 notification after the body; `getState` inside sees the
      intermediate state; nested → 1; empty → 0.
- [ ] Senior: throwing batch body still flushes, rethrows, and leaves `setState` notifying.
- [ ] `shallowEqual` handles primitives, NaN, key count, nested-by-reference, arrays.
- [ ] `useStore` renders the slice and updates it; mounts subscribe, unmount → `listenerCount` 0.
- [ ] Senior: two components on different slices — updating one re-renders only that one; a
      repeated identical write re-renders nothing.
- [ ] Senior: a `batch` of 3 setStates re-renders the subscribed component once (vs. three
      separate acts → three renders).
- [ ] Custom `shallowEqual` slice: unrelated store writes → 0 renders; related → 1; an
      equal-but-new object → 0.
- [ ] Senior: a selector that depends on a prop reflects the new prop without a store write.
- [ ] Senior: the `{start, end}` pair is consistent in every render across 50+ updates.
- [ ] `renderToString` works (server snapshot provided).
- [ ] Source uses `useSyncExternalStore`; contains no `useEffect(` / `useState(`.

## Baseline a11y

Not a UI task; the test components render plain text. Keep `useStore` free of DOM assumptions
so it works in server rendering.

## Constraints

- No third-party libraries (no zustand, redux, immer). React only.
- Do not wrap listeners in `setTimeout`/microtasks — notification is synchronous.
- `getSnapshot` must be referentially stable for unchanged slices (React checks this in dev).

## Interviewer follow-ups

- Why does `useSyncExternalStore` force a synchronous re-render for store updates even inside a
  transition, and what does that cost compared with `useState`? When would you accept tearing?
- The selector cache is keyed on `(state, selector)`. What happens with an inline selector that
  allocates a new object and no `equalityFn` — and how do libraries like Zustand guard it?
- How would you add middleware (logging, persistence, devtools time-travel) without changing
  the public API? Where does `batch` complicate time-travel?
- `getServerSnapshot` returns the same state as the client snapshot here. When is that wrong,
  and how do you avoid a hydration mismatch?

## Say out loud

- **State shape first:** the store holds one immutable object `S`; `useStore` returns a derived
  slice `T` and owns a tiny cache `{ state, selector, selected }` to keep snapshots stable.
- **Race / cleanup hazard:** notification order vs. React's render — `useSyncExternalStore` must
  re-read `getSnapshot` after subscribe to catch updates between render and subscription;
  unsubscribe on unmount; `batch` depth must be reset in a `finally`.
- **One data-shape question:** "Is nested state (`filters`) replaced wholesale on write, or do
  callers expect deep merge?"
- **One failure-handling question:** "If a listener throws during notification, should the
  remaining listeners still run, and who logs the error?"
- **First test you'd write:** subscribe a `jest.fn()`, call `setState` once, expect exactly one
  synchronous call — the contract everything else builds on.
