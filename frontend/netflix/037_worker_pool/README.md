# N37. Worker Pool

**Difficulty:** Hard
**Topics:** Concurrency, Async, Scheduling

---

## Description

Distribute jobs across a fixed-size pool, limiting concurrency and collecting
ordered results — the logic behind a `worker_threads` pool.

## Examples

```ts
await runPool(2, [jobA, jobB, jobC]); // at most 2 run at once
```

## Constraints

- At most `size` jobs in flight.
- Results preserve input order.
- A rejected job rejects the overall promise.
