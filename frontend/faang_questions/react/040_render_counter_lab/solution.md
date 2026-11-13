# 040. Render Counter Lab — reference answers

The lab ships complete; nothing in `render_counter_lab.tsx` changes. The numbers
below are confirmed by `npx jest frontend/faang_questions/react/040_render_counter_lab`
(3/3 green) and by reading the assertions in `render_counter_lab.test.tsx`.

## Phase 1 — mount

Render count of every component: **1** (`app`, `title`, `memo-title`, `panel`,
`stable`, `leaf` each render exactly once). Mount is never skipped — `React.memo`
and element identity only matter on *updates*, so every component in the tree
runs once to produce its initial output.

## Phase 2 — click "Increment app" once (counts cleared after mount)

| id | count | because |
| --- | --- | --- |
| `app` | **1** | `RenderCounterLab` owns `count`; `setCount` schedules an update on it, so its function body runs again. |
| `title` | **1** | `Title` is a plain (non-memoized) child of `app`. A component re-renders whenever its parent re-renders — regardless of whether its props changed (its only prop, `onRender`, is actually identical). |
| `memo-title` | **0** | `MemoTitle` is wrapped in `React.memo`. React shallow-compares the new props `{ onRender }` with the previous ones; the test passes the same `jest.fn()` instance every render, so `Object.is` says "equal" and the render is skipped. |
| `panel` | **1** | Plain child of `app`; parent re-rendered, so it re-renders. Its `children` prop is also a *new* element object this time (see `stable`). |
| `stable` | **1** | `<Stable onRender={onRender} />` is created inside `RenderCounterLab`'s render. When `app` re-renders, JSX produces a **brand-new element object**, so `Panel` receives different `children` and React must reconcile `Stable` again. Wrapping `Stable` in `memo` would be the only thing that could skip it here — the children-as-prop trick alone cannot, because the element really did change identity. |
| `leaf` | **1** | `<Leaf />` is created inside `Panel`'s render; `Panel` re-rendered, so a fresh `Leaf` element is produced and `Leaf` runs again. |

## Phase 3 — click "Toggle panel" once (counts cleared after mount)

| id | count | because |
| --- | --- | --- |
| `app` | **0** | The state that changed (`open`) lives in `Panel`. Updates propagate *down* the tree from the owner of the state, never up; `RenderCounterLab` is untouched. |
| `title` | **0** | Its parent (`app`) did not re-render, so neither does it. |
| `memo-title` | **0** | Same — parent did not re-render (and even if it had, memo would have bailed). |
| `panel` | **1** | `Panel` owns `open`; `setOpen` re-runs its function body. |
| `stable` | **0** | `Panel` re-rendered, but its `children` prop is the **exact same element object** that `RenderCounterLab` created on the previous render (app did not re-run, so nothing re-created it). During reconciliation React sees `oldElement === newElement` (same reference, and no pending context change) and bails out of that subtree *without* `React.memo`. |
| `leaf` | **1** | `<Leaf onRender={onRender} />` is created inside `Panel`'s own render, so a new element object is produced every time `Panel` runs; `Leaf` is not memoized, so it re-renders. |

## Key rules

1. **A component re-renders when its own state changes (or a context it reads
   changes), or when its parent re-renders** — *not* "when its props change".
   Props changing is a consequence of the parent re-rendering, not the trigger;
   a plain child re-renders even with byte-identical props.
2. **`React.memo` skips the re-render when a shallow comparison (`Object.is` per
   prop key) of the previous and next props finds no differences.** Any new
   object/array/function identity — an inline arrow, an object literal, a new
   `children` element — defeats it.
3. **An element received via `children` does not re-render when the receiving
   component's own state changes, because the element object was created by
   the parent (the owner), not by the receiving component. The receiver's
   re-render reuses the identical element reference, and React's reconciler
   bails out when `oldProps === newProps` for the same element type.**
4. **The same `children` element DOES re-render when the creating component
   re-renders, because JSX (`createElement`) allocates a new element object on
   every call; the receiving component now gets a different `children`
   reference, so the bail-out condition no longer holds.**

## Interviewer follow-ups

- **Why does `MemoTitle` stay memoized even though it receives `onRender`?**
  Because the test passes the same `jest.fn()` instance on every render, so the
  `onRender` prop is referentially identical. It would start re-rendering every
  time if the test (or a parent) passed an inline wrapper like
  `onRender={(id) => probe(id)}`, or if `RenderCounterLab` created a new
  function per render (e.g. `useCallback` with changing deps, or no `useCallback`).
- **What does React compare to bail out of `Stable` without memo?** During
  `beginWork`, if the fiber's `pendingProps === memoizedProps` (same element
  object → same props object), there is no pending work on that fiber, and no
  context it consumes has changed, React clones the existing children and skips
  calling the component. The children-as-prop pattern works because the props
  object is literally the same reference.
- **If `Panel` were `React.memo`'d, would "Increment app" still re-render it?**
  Yes. `app` re-renders and recreates `<Stable />`, so `Panel`'s `children`
  prop is a new element object; the shallow compare fails on `children`, and
  `Panel` re-renders anyway. To make it skip, `app` would have to hoist/`useMemo`
  the `<Stable />` element (or `Stable` itself would be memoized).
- **Does a re-render mean the DOM was touched?** No. "Re-render" means the
  component function ran and produced a new element tree (render phase). React
  then diffs that tree against the current fibers; only the places where the
  output differs become effects that are applied to the DOM in the commit
  phase. The browser paints after commit. A component can re-render many times
  with zero DOM mutations — the cost is CPU in the render phase, not paint.
