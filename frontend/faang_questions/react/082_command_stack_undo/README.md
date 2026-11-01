# 082. Command Stack Undo

**Difficulty:** Hard
**Estimated time:** 60 minutes
**Topics:** Command Pattern, Undo/Redo, Coalescing, Batch Transactions, Stable Hook API

---

## Scenario

Every editor on the ML data-annotation platform — span labeler, bounding-box
annotator, transcript corrector — reimplements undo with its own
`useState<T[]>` history. They disagree on whether drag moves undo in one step
or fifty, "Accept all suggestions above 0.8" leaves twenty entries that must
be undone one by one, and none of them cap memory on a two-hour session. The
platform team wants one generic `useCommandHistory<T>()` built on command
objects, so each editor only describes `do`/`undo` and the shared hook owns
coalescing, redo invalidation, size limits and transactions.

## Requirements

1. `useCommandHistory<T>(initial, options?)` returns
   `{ state, execute, undo, redo, canUndo, canRedo, beginBatch, endBatch }`.
2. `execute(cmd)` applies `cmd.do(state)` and pushes an undoable entry.
   `undo()` applies the top entry's `undo` and moves it to the redo stack;
   `redo()` applies the top redo entry's `do` and moves it back. `canUndo` /
   `canRedo` reflect the stacks.
3. `undo()` with nothing to undo and `redo()` with nothing to redo are no-ops
   (state identity unchanged).
4. Any `execute` after an `undo` discards the redo stack.
5. Coalescing: an executed command whose `mergeKey` is defined and equal to
   the top entry's `mergeKey` merges into that entry (compose the `do`s in
   order and the `undo`s in reverse) instead of pushing a new one. A command
   with a different or undefined `mergeKey` starts a new entry. `undo` /
   `redo` close the merge window: the next command always starts a new entry
   even if its `mergeKey` matches the restored top.
6. `options.limit` caps the number of undoable entries; when exceeded, the
   oldest entry is dropped (it can no longer be undone). A merged run counts
   as one entry.
7. `beginBatch()` / `endBatch()`: every command executed between them is
   applied to `state` immediately but recorded as a single entry when the
   outermost `endBatch` runs. Nested batches flatten into that one entry. A
   batch never merges with entries before or after it, even if its commands
   carry `mergeKey`s. An empty batch adds no entry; an unbalanced `endBatch`
   is ignored.
8. `execute`, `undo`, `redo`, `beginBatch`, `endBatch` keep stable identities
   across renders (safe to pass as props / effect deps).

## Acceptance Criteria

- [ ] execute/undo/redo round-trip on a `{ spans: Span[] }` model; flags
      correct at each step.
- [ ] No-op undo/redo keep the same `state` reference.
- [ ] New command after undo → `canRedo === false`, redo does nothing.
- [ ] Composed sequences undo in reverse order.
- [ ] Five `type` commands with `mergeKey: 'typing'` undo in one step and
      redo in one step.
- [ ] Different / undefined `mergeKey` breaks the merge.
- [ ] Drag coalescing per span id restores the original end in one undo.
- [ ] After undo+redo, a same-key command is a separate entry.
- [ ] `limit: 3` after five commands → exactly three undos, then `canUndo`
      is false and a further undo is a no-op.
- [ ] A merged run counts once toward the limit.
- [ ] Batch groups commands into one undo/redo step; state visible inside an
      open batch; nested batches flatten.
- [ ] Batch of mergeable commands is one entry and does not merge with
      surrounding typing.
- [ ] Empty batch adds nothing; extra `endBatch` ignored.
- [ ] Function identities stable across renders.

## Baseline a11y

This is a pure hook with no DOM, so there is nothing to render. When wiring it
into an editor, be ready to say how you would expose `canUndo`/`canRedo` as
`disabled` on the Undo/Redo buttons, map Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z, and
announce `Undid: <label>` in a polite live region.

## Constraints

- React + TypeScript only; no third-party libraries (no immer, no
  use-undo).
- Commands are plain objects; the hook never serialises or clones state.
- Do not change the exported types or hook signature.

## Interviewer follow-ups (talk-through, not implemented)

- The server has its own event log. How would you reconcile a local undo
  with a collaborator's concurrent edit — OT, CRDT, or server-authoritative
  rejection of the undo?
- `limit` bounds entries, not memory: a merged "typing" entry holds a
  closure chain of thousands of steps. How would you flatten merged entries
  (store before/after snapshots or a diff) and what does that cost?
- Some commands are async (e.g. "accept suggestion" writes to the server).
  Where does the pending state live and what happens if undo is pressed while
  the `do` is in flight?
- How would you expose labels for the UI ("Undo Add span") and a history
  panel that lets the user jump to an arbitrary entry?

## Say out loud

- State shape first: `{ present: T; past: Entry[]; future: Entry[]; mergeOpen: boolean }`
  in one `useState`, with batch depth and the pending batch commands in a
  ref because they must not trigger renders.
- Name the race/cleanup hazard: `execute` may be called several times within
  one event (typing, drag) before React re-renders, so every transition must
  be a functional update; the batch depth must be read synchronously, not
  from the last rendered state.
- Ask one data-shape question: "Must `do` and `undo` be pure functions of
  the state, or may a command capture the state it was created against?"
- Ask one failure-handling question: "If `do` throws, do we leave the history
  untouched, or push the entry and surface the error?"
- Name the first test you'd write: "Five typing commands with the same
  mergeKey undo in one step."
