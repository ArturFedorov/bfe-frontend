# 061. Log Ring Buffer

**Difficulty:** Medium
**Topics:** Circular Buffer, Queue, Index Arithmetic

---

## Description

Your crash reporter attaches the last N log lines to every error report. Logs
stream in forever, so you cannot keep them all — build a fixed-capacity ring
buffer that holds only the most recent `capacity` lines. When the buffer is
full, a new `append` silently overwrites the oldest line. `getAll()` returns the
retained lines oldest-to-newest, and `size()` reports how many lines are
currently held (at most `capacity`).

**On your honor:** `append` must be O(1) using a fixed backing array and a write
index with `% capacity` arithmetic — no `Array.prototype.shift`, no `slice`-and-
reassign, no unbounded array that you trim. The whole point of a ring buffer is
that nothing ever moves.

## Examples

```ts
const buf = new LogRingBuffer(3);
buf.append('a');
buf.append('b');
buf.append('c');
buf.append('d');   // overwrites 'a'
buf.getAll();      // ['b', 'c', 'd']
buf.size();        // 3
```

## Constraints

- The constructor throws an `Error` when `capacity` is not a positive integer.
- `getAll()` on an empty buffer returns `[]`; it returns a fresh array each call
  (mutating the result must not affect the buffer).
- `size()` grows from `0` up to `capacity` and never exceeds it.
- Up to `100_000` appends; `append` is O(1), `getAll` is O(capacity).

## Target

O(1) append with no element shifting; O(capacity) memory regardless of how many lines ever arrived.

## Interviewer follow-up

How would you make this buffer safe for a producer thread appending while a consumer thread snapshots `getAll()`?
