# N39. Async Task Queue with Concurrency

**Difficulty:** Medium
**Topics:** Async, Concurrency, Retries

---

## Description

Process tasks with a configurable concurrency limit and per-task retry on
failure, returning ordered results.

## Examples

```ts
await runQueue(tasks, { concurrency: 4, retries: 2 });
```

## Constraints

- At most `concurrency` tasks in flight.
- Retry a failed task up to `retries` additional times before giving up.
- Results preserve input order.
