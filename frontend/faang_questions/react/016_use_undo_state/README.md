# 016. useUndoState

**Difficulty:** Hard
**Topics:** Custom Hooks, Immutable History, Undo/Redo, useCallback

---

## Scenario

The delivery-rules editor lets partner ops build routing rules, and one wrong
edit used to mean rebuilding the rule from scratch. Product wants real
undo/redo — the same past/present/future model as your algo task 004, but as a
hook: `useUndoState(initial)`. Every `set` becomes an undoable step; undo
walks back, redo walks forward, and — exactly like a text editor — making a
new edit after undoing throws away the "future" branch.

## Acceptance Criteria

- `useUndoState<T>(initial)` returns
  `{ state, set, undo, redo, canUndo, canRedo }`.
- `state` starts as `initial`; `canUndo` and `canRedo` start `false`.
- `set(value)` records the current state into the past and makes `value` the
  present; it also accepts a functional update `set(prev => next)`.
- `undo()` moves the present into the future and restores the most recent
  past state; `redo()` does the inverse. Multiple undos/redos walk the full
  history in order.
- Boundary safety: `undo()` with no past and `redo()` with no future are
  silent no-ops.
- **A new `set` after undo clears the future** — `canRedo` becomes `false`
  and `redo()` no longer does anything (the discarded branch is gone).
- `canUndo` is `true` iff at least one past state exists; `canRedo` iff at
  least one future state exists.
- `set`, `undo`, and `redo` keep stable identities across renders (functional
  state updates only — no stale closures over history).

## Example

```ts
function RuleEditor() {
  const { state, set, undo, redo, canUndo, canRedo } = useUndoState('');
  return (
    <>
      <textarea aria-label="Rule body" value={state} onChange={(e) => set(e.target.value)} />
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </>
  );
}
```

## Target

One `useState<{ past: T[]; present: T; future: T[] }>` plus three stable
`useCallback`s, each a pure functional update on the history object.

## Interviewer follow-up

Typing in the textarea records a history entry per keystroke. How would you
add grouping/coalescing (one undo step per pause in typing) without breaking
the stable identities of `set`/`undo`/`redo`?
