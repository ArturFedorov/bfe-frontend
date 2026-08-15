# 059. Undo / Redo State Manager

**Difficulty:** Easy
**Topics:** Stack, State Management, API Design

---

## Description

Your text editor needs the standard undo/redo behavior every user expects. Build
a state manager that holds the current document state, records a new state on
every user action via `do(nextState)`, steps backward with `undo()`, and steps
forward with `redo()`. The classic rule applies: performing a **new** action
after undoing discards the entire redo chain — you cannot redo into a timeline
that no longer exists. The manager is generic over the state type so it works
for strings, objects, or full document snapshots.

## Examples

```ts
const mgr = new UndoRedoManager('v1');
mgr.do('v2');
mgr.do('v3');
mgr.undo();      // 'v2'
mgr.undo();      // 'v1'
mgr.redo();      // 'v2'
mgr.do('v2b');   // new action — redo to 'v3' is now gone
mgr.canRedo();   // false
mgr.getState();  // 'v2b'
```

## Constraints

- The constructor takes the initial state; `getState()` always returns the current state.
- `undo()` / `redo()` return the new current state after moving.
- `undo()` when `canUndo()` is `false` throws an `Error`; same for `redo()` / `canRedo()`.
- `do(nextState)` clears any pending redo states.
- Up to `100_000` operations; every operation must be O(1).

## Target

O(1) per operation (`do`, `undo`, `redo`, `getState`); O(n) total space for n actions.

## Interviewer follow-up

If each state snapshot were a multi-megabyte document, how would you change the design to keep memory bounded?
