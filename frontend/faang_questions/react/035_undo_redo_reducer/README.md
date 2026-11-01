# 035. Undo/Redo Reducer

Difficulty: Medium

Topics: higher-order reducers, generics, immutable history

## Scenario

Two internal tools — the delivery-schedule editor and the partner-notes panel —
both shipped their own buggy undo implementations. Instead of fixing each one,
build `withUndoRedo`: a higher-order reducer that wraps *any* base reducer and
adds history. Whatever the base reducer manages, the wrapper tracks
`past / present / future` and handles `undo`, `redo`, and `checkpoint` uniformly.

## Acceptance Criteria

- `withUndoRedo(baseReducer)` returns a reducer over
  `HistoryState<S> = { past: S[]; present: S; future: S[] }`.
- It is generic: it must work wrapping any base reducer without knowing its state
  or action shapes. The action types `'undo' | 'redo' | 'checkpoint'` are reserved
  for the wrapper; every other action is forwarded to the base reducer.
- Forwarded action: previous `present` is pushed onto `past`, the new result
  becomes `present`, and `future` is cleared — **a new action after undo discards
  the redo stack**.
- If the base reducer returns the same reference (a base-level no-op), the wrapper
  returns the same history state — no junk history entries.
- `undo` moves `present` onto `future` and pops the last `past` entry; `redo` is
  the mirror image. Either with an empty stack is a same-reference no-op.
- `checkpoint` commits the current `present` as the new baseline: `past` and
  `future` are emptied, so the user cannot undo past a checkpoint (e.g. after a
  successful save).
- `createHistoryState(present)` builds the initial wrapper state; `canUndo` /
  `canRedo` report stack emptiness.

## Example

```ts
const counter = (n: number, a: { type: 'inc' }) => (a.type === 'inc' ? n + 1 : n);
const reducer = withUndoRedo(counter);
let s = createHistoryState(0);
s = reducer(s, { type: 'inc' });  // present 1, past [0]
s = reducer(s, { type: 'undo' }); // present 0, future [1]
s = reducer(s, { type: 'inc' });  // present 1, future [] — redo discarded
```

## Target

- Fully generic, no `any` leaking into the public API.
- Pure and immutable; history arrays are never mutated in place.
- ~45 lines.

## Interviewer follow-up

- How would you cap history length without breaking redo?
- What breaks if a base action legitimately uses the type `'undo'`? How would you
  namespace the wrapper actions instead?
- How would you group rapid keystrokes into a single undo step (debounced history)?
