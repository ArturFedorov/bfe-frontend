# 042. Callback Stability

Difficulty: Medium
Topics: useCallback, useMemo, memo boundaries, over-memoization

## Scenario

Someone already wrapped the filter panel's children in `React.memo` after a "the filters feel laggy" ticket — and closed the ticket. The lag is still there: profiling shows the memoized `CategorySelect` re-renders on every search keystroke and `SearchBox` re-renders on every category change. The memo boundaries exist, but every render feeds them fresh callback and array identities, so the shallow compare never passes.

Meanwhile a well-meaning `useMemo` was sprinkled on a trivial summary string. Its dependencies change on every meaningful render, so the cache never hits — it is pure overhead (dependency comparison + retained closure) with zero benefit.

This is a **fix-the-code** task (`// TODO: fix the performance problem below` in `callback_stability.tsx`):

1. Stabilize exactly what the memo boundaries need (`useCallback` for the two handlers, `useMemo` for the derived `items` array).
2. **Delete** the block marked `OVER-MEMOIZED` — replace it with a plain expression, marker comment and all.

### Render-count convention

Components accept `onRender?: (id: string) => void` and call it at the top of the function body (`'panel'`, `'search-box'`, `'category-select'`, `'result-list'`). Tests count calls per id. Do not remove these calls.

## Acceptance Criteria

- Behavior unchanged: text filter works, category filter works, they combine, the summary line stays accurate.
- Typing in Search: `search-box` and `result-list` re-render per keystroke; `category-select` re-renders **0** times.
- Changing Category: `category-select` and `result-list` re-render once; `search-box` re-renders **0** times.
- The `OVER-MEMOIZED` marker (and the useMemo it labels) no longer appears in the source — the summary is a plain template string.
- No new memoization anywhere it does not enable a bailout.

## Example

```tsx
const probe = jest.fn();
render(<FilterPanel onRender={probe} />);
probe.mockClear();
await user.type(screen.getByLabelText('Search'), 'abc');
// after the fix: probe never called with 'category-select'
```

## Target

- Unrelated memoized child re-renders per interaction: **0** (was 1 per keystroke / per change).
- `CATALOG.filter` runs only when `query` or `category` changed — not on every render.
- Net memoization count goes DOWN by one: two `useCallback` + one `useMemo` added where they hold a boundary; one `useMemo` deleted where it never could. Rule of thumb: memoize only when (a) a memo boundary or effect dep consumes the identity, or (b) the computation is provably expensive.

## Interviewer follow-up

- Why does `useMemo` on the summary string cost more than it saves, concretely? What does React store and compare on every render for it?
- The `items` useMemo returns a new array whenever `query` changes even if the filtered CONTENTS are identical. Is that a problem worth solving? What would it take?
- If `handleQueryChange` needed the current `category` inside, how do you keep it stable — deps array, functional update, or a ref? Trade-offs?
- React Compiler / `"use memo"` promises to make manual useCallback obsolete. What invariant does your fixed code rely on that the compiler automates?
