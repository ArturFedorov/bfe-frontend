# 074. Sequential vs Parallel vs Chunked Execution

**Difficulty:** Easy
**Topics:** Promises, Concurrency, Async Orchestration

---

## Description

A deploy pipeline has a list of async steps, each given as a task factory `() => Promise<T>`.
Implement three runners over the same input. `runSequential` runs tasks strictly one at a
time in arrival order and stops on the first error — later tasks are never started.
`runParallel` invokes every factory up front and fails fast: it rejects as soon as any task
rejects, without waiting for the rest. `runChunked(tasks, k)` runs tasks in fixed chunks of
`k`: everything inside a chunk runs in parallel, the next chunk starts only after the previous
chunk has fully resolved, and an error rejects the run and skips all later chunks. All three
resolve with results in input order regardless of which task finishes first.
Repeat drill — you have solved this shape before; do it from a blank file without looking at your old solution.

## Examples

```ts
const tasks = [
  () => fetchStep('build'),
  () => fetchStep('test'),
  () => fetchStep('deploy'),
];

await runSequential(tasks); // ['build-ok', 'test-ok', 'deploy-ok'] — one at a time
await runParallel(tasks);   // same array, but all three started immediately
await runChunked(tasks, 2); // chunk ['build', 'test'] in parallel, then ['deploy']
```

## Constraints

- Results are always in input order, never in completion order.
- `runSequential`: task `i + 1` must not start until task `i` has resolved; on rejection,
  reject with that error and never invoke the remaining factories.
- `runParallel`: all factories are invoked immediately in input order; the first rejection
  wins (fail fast), even while other tasks are still pending.
- `runChunked`: at most `k` tasks in flight; a new chunk starts only when the whole previous
  chunk is done; a rejection skips all later chunks. `k >= tasks.length` behaves like
  `runParallel`, `k === 1` behaves like `runSequential`.
- `runChunked` throws a `RangeError` synchronously if `k < 1`.
- An empty task list resolves to `[]` in all three modes.

## Target

Each mode honors its start discipline exactly (serial / all-at-once / chunk-bounded) while the result array always mirrors input order.

## Interviewer follow-up

`runParallel` rejects fast, but the losing tasks keep running in the background — how would you prevent their late rejections from becoming unhandled-rejection noise?
