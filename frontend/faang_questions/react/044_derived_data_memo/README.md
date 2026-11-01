# 044. Derived Data Memo

Difficulty: Medium
Topics: useMemo, derived state, render-time computation, state duplication

## Scenario

The delivery dashboard filters and sorts 10,000 rows. The derivation (filter by title substring, then sort by title or ETA) costs real milliseconds — and right now it runs on **every render**, including renders triggered by the "Compact mode" toggle, which the derivation does not even read. Ops sees the whole page hitch when they change display density.

This is a **fix-the-code** task (`// TODO: fix the performance problem below` in `derived_data_memo.tsx`). Two rules define the correct shape:

1. Derive at render time, memoized: the filter+sort belongs in a `useMemo` keyed on exactly what it reads (`rows`, `query`, `sortKey`).
2. **Never copy derived data into state.** The `useEffect` + `setState` mirror is the classic wrong fix — it adds an extra render per change, invites staleness, and the test suite statically rejects any `useEffect(` call in this file.

### Render/derivation probe convention

Like every Topic 6 task the component takes `onRender?: (id: string) => void`. This task adds a second probe, `onDerive?: () => void`, which must be called **once per execution of the derivation** — keep the call inside whatever recomputes the visible rows, so the tests can count real recomputations.

## Acceptance Criteria

- Behavior unchanged: match count line, first-20 list, substring filter, title/eta sort, compact toggle.
- Mount derives exactly once.
- Toggling Compact mode (any unrelated state) derives **zero** times.
- A query change derives exactly once; a sort change derives exactly once.
- No `useEffect(` in the file; the visible rows are never stored with `useState`.

## Example

```tsx
const onDerive = jest.fn();
render(<DeliveryDashboard onDerive={onDerive} />);
onDerive.mockClear();
await user.click(screen.getByLabelText('Compact mode'));
expect(onDerive).not.toHaveBeenCalled(); // fails until fixed
```

## Target

Derivation budget: **O(n log n) work only when `query`, `sortKey`, or `rows` change; O(0) derivation work on any other render.** Concretely: mount = 1 derive, k unrelated re-renders = 0 derives, each input change = exactly 1 derive. State count stays at three primitives (`query`, `sortKey`, `compact`) — derived arrays never enter state.

## Interviewer follow-up

- Why is `useEffect(() => setVisible(derive(...)), [query, sortKey])` worse than `useMemo` even though its probe counts would look identical? Walk through the render timeline.
- `deriveVisible` sorts a copy today. If it sorted the filtered array in place on the ORIGINAL array reference, what user-visible bug could appear with `useMemo` caching?
- The component renders only the first 20 rows but derives all 10k. When does it make sense to push filtering/sorting to the server instead, and what does the memo buy you then?
- `useMemo` is a cache of size 1. Give a real interaction pattern on this dashboard where that cache is useless, and what you would reach for instead.
