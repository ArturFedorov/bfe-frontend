# 080. Request Batcher

**Difficulty:** Medium
**Topics:** Batching, Promises, Timers, Fan-out

---

## Description

A profile page issues dozens of `getUser(id)` calls in one render, and the backend offers a
bulk endpoint. Implement `createBatcher(batchFn, { maxWaitMs, maxSize })` that returns a
single-key loader `(key) => Promise<V>`. The first call opens a batch and starts a
`maxWaitMs` timer; subsequent calls join it. The batch flushes as one `batchFn(keys)` call
either when it reaches `maxSize` unique keys (immediately, cancelling the timer) or when the
timer fires — whichever comes first. Results come back as a `Map<K, V>` and are fanned out to
each caller by key; duplicate keys within a batch are deduplicated and share one slot and one
result.
Repeat drill — you have solved this shape before; do it from a blank file without looking at your old solution.

## Examples

```ts
const getUser = createBatcher(
  (ids: string[]) => api.bulkGetUsers(ids), // Promise<Map<string, User>>
  { maxWaitMs: 10, maxSize: 50 }
);

// three synchronous calls -> ONE bulkGetUsers(['u1', 'u2', 'u3']) after 10ms
const [a, b, c] = await Promise.all([getUser('u1'), getUser('u2'), getUser('u3')]);

// 50 calls arrive fast -> flushes immediately at maxSize without waiting
const users = await Promise.all(fiftyIds.map(getUser));
```

## Constraints

- `batchFn` is called exactly once per batch, with unique keys in first-call order.
- Flush on whichever comes first: unique-key count reaching `maxSize` (immediate, timer
  cancelled) or `maxWaitMs` elapsing since the batch opened.
- Duplicate keys in one batch are deduplicated: they count once toward `maxSize` and all
  their callers resolve with the same value.
- If `batchFn` rejects, every caller of that batch rejects with that error; other batches are
  unaffected.
- If the result `Map` is missing a caller's key, only that caller rejects (with an `Error`
  naming the key); callers whose keys are present still resolve.
- After a flush, the next call opens a fresh batch with a fresh timer — including while the
  previous batch's `batchFn` is still in flight.

## Target

Exactly one batchFn call per batch, flushed by size or timer (whichever first), with per-key fan-out of values and errors.

## Interviewer follow-up

Where does this batcher sit relative to a cache like DataLoader's — what changes if two *different* batches request the same key, and should they share a result?
