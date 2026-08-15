# 004. Editor Undo History

**Difficulty:** Easy
**Topics:** Arrays, Circular Buffers, Data Structure Design

---

## Description

A document editor keeps a bounded history of document snapshots so users can
jump back to earlier states without the memory ever growing past a limit.
Implement `UndoHistory<T>` with a maximum depth: `push` appends a new snapshot
and silently drops the oldest one once the depth limit is reached. Retained
snapshots are addressed by index `0..size()-1`, where `0` is the oldest still
kept. `jumpTo(index)` restores that snapshot: it returns it and discards every
snapshot newer than it (a new edit after a jump starts a fresh branch, exactly
like a real editor).

## Examples

```ts
const h = new UndoHistory<string>(3);
h.push('a');
h.push('b');
h.push('c');
h.current();  // 'c'

h.push('d');  // depth 3 exceeded — 'a' is dropped
h.size();     // 3 — ['b', 'c', 'd']

h.jumpTo(0);  // 'b' — and 'c', 'd' are discarded
h.size();     // 1
h.push('x');  // history is now ['b', 'x']
h.current();  // 'x'
```

## Constraints

- `maxDepth` must be a positive integer; the constructor throws `RangeError` otherwise.
- `current()` throws `Error` when the history is empty.
- `jumpTo(index)` throws `RangeError` for any index outside `[0, size())`; `jumpTo(size() - 1)` is a no-op that returns the current snapshot.
- Dropping the oldest snapshot shifts the indices of the survivors down by one.
- Duplicate (even identical) snapshots are stored as separate entries.

## Target

Amortized O(1) `push` — dropping the oldest must not shift every element
(think ring buffer); an O(n)-per-push solution will fail the large-input test
(`maxDepth` 50k, 100k pushes).

## Interviewer follow-up

Snapshots are full document copies and memory is exploding — how would you
redesign the history around deltas or structural sharing, and what would
`jumpTo` cost then?
