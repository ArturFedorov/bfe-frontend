# 100. Feature Flag Context

**Difficulty:** Medium
**Estimated time:** 45 min
**Topics:** `useSyncExternalStore`, selector hooks, render isolation, context-as-store, local overrides persisted to `Storage`, graceful no-provider behaviour

---

## Scenario

Marketing ops ships UI behind feature flags: the new audience builder, the
push-channel preview, the approvals redesign. Flags arrive from the server as a
`Record<string, boolean>`; QA and PMs flip flags locally through a dev
overlay to test both branches, and expect their overrides to survive a page
reload. The first `FlagsContext` stored the whole map in context, so every
flag consumer re-rendered whenever any flag or override changed — the campaign
table re-rendered 40 rows because someone toggled a flag for the templates
screen. Rebuild the provider on top of `useSyncExternalStore` so consumers
re-render only when *their* value changes.

## Contract

```tsx
<FlagsProvider flags={{ 'audience-builder': true }} storage={window.localStorage}>
  …
</FlagsProvider>

useFlag(name: string): boolean
useFlags<T>(selector: (flags: Readonly<Record<string, boolean>>) => T, equalityFn?: (a: T, b: T) => boolean): T
useFlagOverride(): { set(name: string, value: boolean | null): void; overrides: Readonly<Record<string, boolean>> }
<Feature flag="audience-builder" fallback={<OldBuilder />}>
  <NewBuilder />
</Feature>

OVERRIDES_STORAGE_KEY === 'flag-overrides'
```

## Requirements

1. **Effective flags.** `effective[name] = override[name] ?? flags[name] ?? false`.
   `useFlag(name)` returns the effective boolean; unknown flags are `false`.
2. **Selector hook.** `useFlags(selector, equalityFn = Object.is)` runs the
   selector against the effective flag map and re-renders the caller only
   when the selected value changes per `equalityFn`. Selectors may return
   objects; with a shallow `equalityFn` an unchanged selection must not
   re-render.
3. **`useSyncExternalStore`.** The provider holds a store (subscribe /
   getSnapshot) and exposes it through context; consumers subscribe with
   `useSyncExternalStore`. `getSnapshot` must return a referentially stable
   value between changes.
4. **Render isolation.** A component reading flag `a` does **not** re-render
   when flag `b` changes (via the `flags` prop or an override). Tests count
   renders with the `onRender` convention — a probe called at the top of the
   consumer body.
5. **Provider prop changes propagate.** When `flags` changes, every consumer
   whose effective value changed re-renders with the new value.
6. **Overrides.** `useFlagOverride().set(name, true|false)` sets a local
   override; `set(name, null)` clears it. `overrides` reflects the current
   map. Overrides are persisted to `storage` (when given) under
   `'flag-overrides'` as JSON and restored on mount. Invalid stored JSON is
   ignored. Without `storage`, overrides live in memory only.
7. **`<Feature>`.** Renders `children` when the flag is on, otherwise
   `fallback` (or nothing).
8. **No provider.** `useFlag` returns `false` and calls `console.warn` **once
   per flag name** (two consumers of the same flag → one warning).
   `useFlagOverride` without a provider throws a descriptive error.

## Acceptance Criteria

- [ ] `useFlag` returns the provider value; unknown flag → `false`.
- [ ] `<Feature>` renders children when on, fallback when off, nothing when off
      and no fallback.
- [ ] `useFlags` returns the selected value; with a shallow `equalityFn` an
      object selection does not re-render when an unrelated flag flips.
- [ ] Changing the `flags` prop updates consumers of the changed flag.
- [ ] `set('b', true)` overrides a `false` provider flag; `set('b', null)` falls
      back to the provider value; `overrides` reflects both.
- [ ] Overrides are written to `storage` under `flag-overrides` as JSON and
      restored on mount; invalid JSON in storage is ignored.
- [ ] Senior: consumer of `a` renders exactly once while `b` is flipped via
      the prop and then overridden; consumer of `b` renders once per change.
- [ ] Senior: without a provider two `useFlag('x')` readers plus one
      `useFlag('y')` reader produce exactly two `console.warn` calls, and all
      return `false`.
- [ ] `useFlagOverride` outside a provider throws.

## Baseline a11y

- Not a UI task; the demo exposes overrides as labelled checkboxes.

## Constraints

- React only. No `use-sync-external-store/with-selector` import — implement
  the selector caching yourself (a ref holding the last snapshot/selector/
  selection is enough).
- Do not store the flag map in `useState` inside the provider and pass it
  through context value — that defeats isolation.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- Flags now arrive over SSE and change 10×/s. What breaks with
  `useSyncExternalStore` (tearing vs. forced sync renders) and how would you
  batch?
- Overrides are per browser. Product wants per-user overrides synced to the
  server. Where does the write go and what happens on conflict?
- Add `useFlagVariant(name): 'control' | 'a' | 'b'`. What changes in the
  store shape and the selector?
- Server-rendered pages: how do you avoid the hydration mismatch when a stored
  override disagrees with the server flag?

## Say out loud

- State shape first: `base: Flags`, `overrides: Flags`, derived `effective`
  (recomputed once per change and cached), `listeners: Set<() => void>`.
- Name the hazard: a selector that returns a new object every call makes
  `useSyncExternalStore` loop forever — cache by (snapshot, selector) and
  compare with `equalityFn`.
- Ask one data-shape question: can a flag value be a string/variant, or
  strictly boolean?
- Ask one failure-handling question: when `storage.setItem` throws (quota,
  private mode), do we keep the in-memory override or revert?
- Name the first test you would write: "consumer of `a` does not re-render
  when `b` changes".
