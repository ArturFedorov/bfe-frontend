# 005. Report Batch Processor

**Difficulty:** Medium
**Topics:** Bounded Concurrency, Error Isolation, Promise Orchestration

---

## Scenario

Month-end close kicks off ~10k partner report jobs. `Promise.all` over all of
them melts the downstream billing API; a naive `for…await` loop takes hours;
and today one malformed partner record rejects the whole batch, losing 9,999
good results. Build the batch processor: run jobs through an injected worker
function with **bounded concurrency**, isolate per-job failures, and return
every outcome in input order.

## Requirements

- `processBatch(jobs, worker, { concurrency })` runs `worker(job, index)` for
  every job with at most `concurrency` workers in flight at any instant.
- Results come back **in input order**, one entry per job, regardless of
  completion order.
- Per-job error isolation: a rejected worker produces
  `{ status: 'rejected', reason }` in its slot; every other job still runs and
  settles. The batch promise itself never rejects for a job failure.
- Success entries are `{ status: 'fulfilled', value }`.
- A slot is freed the moment a job settles — the next queued job starts
  immediately (no "wave" batching where the whole group must finish first).
- `concurrency` must be a positive integer — throw a `RangeError` otherwise
  (this is a caller bug, not a job failure).
- `concurrency` larger than the job count just runs everything at once;
  an empty job list resolves to `[]` without calling the worker.
- The worker is injected — no timers or I/O inside the processor itself, so
  the whole thing is deterministic under test.

## Example

```ts
const results = await processBatch(
  partnerIds,
  (id) => billingApi.generateReport(id),
  { concurrency: 5 },
);
// results[i] corresponds to partnerIds[i]:
// { status: 'fulfilled', value: Report } | { status: 'rejected', reason: Error }
```

## Target

25–30 minutes. The senior signals: a shared-cursor worker pool (not chunked
waves), writing results by index instead of push order, and the
`Promise.allSettled`-shaped result that keeps one bad job from poisoning the
batch.

## Interviewer follow-up

The billing API starts returning 429s under load. Where would you plug retry
with backoff into this design — inside the worker, or inside the pool — and
what does each choice do to your concurrency guarantee?
