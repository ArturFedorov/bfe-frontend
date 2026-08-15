# 078. Concurrency Pool

**Difficulty:** Medium
**Topics:** Concurrency Limiting, Promises, Task Scheduling, Error Aggregation

---

## Description

A media pipeline must transcode hundreds of files, but the box only tolerates `k` jobs at
once. Implement `runPool(tasks, k)` over task factories `() => Promise<T>`: at most `k` tasks
are in flight at any moment, and the instant one settles, the next queued task starts — no
chunk boundaries. Unlike `Promise.all`, a rejection must not stall or abandon the pool: every
task still runs to completion. If everything succeeds, resolve with results in input order;
if anything failed, reject (after all tasks settle) with a `PoolError` whose `errors` array
holds the rejection reasons in input order.
Repeat drill — you have solved this shape before; do it from a blank file without looking at your old solution.

## Examples

```ts
const tasks = files.map((f) => () => transcode(f));

// at most 3 transcodes in flight; results ordered like `files`
const outputs = await runPool(tasks, 3);

// two tasks fail: every task still ran, then the pool rejects
try {
  await runPool(tasks, 3);
} catch (e) {
  if (e instanceof PoolError) console.log(e.errors); // reasons in input order
}
```

## Constraints

- Never more than `k` tasks in flight; a finished task immediately frees its slot for the
  next one (slot refill, not chunking).
- Tasks are started in input order; results are returned in input order regardless of
  completion order.
- One rejection does not stop the pool: all remaining tasks still start and settle.
- On any failure, reject with `PoolError` (exported class) carrying all rejection reasons in
  input order — only after every task has settled.
- `k === 1` degenerates to strict sequential execution; `k >= tasks.length` starts everything
  immediately.
- Throw a `RangeError` synchronously when `k < 1`; an empty task list resolves to `[]`.

## Target

At most k in flight with instant slot refill, input-order results, and no task abandoned on failure.

## Interviewer follow-up

How would you add cancellation so that after the first failure the pool stops *starting* new tasks (but still waits for in-flight ones), and what changes in the PoolError contract?
