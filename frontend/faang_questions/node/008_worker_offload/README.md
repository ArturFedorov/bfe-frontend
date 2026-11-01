# 008. Worker Offload

**Difficulty:** Hard
**Topics:** worker_threads, CPU-Bound Work, Event Loop Responsiveness

---

## Scenario

Partners upload multi-hundred-MB delivery archives, and the ingest service
computes an integrity checksum (iterated SHA-256) for each before
acknowledging. Right now that hashing runs on the main thread — while one
big archive hashes, health checks time out, heartbeats stop, and the
orchestrator restarts a perfectly healthy pod. Move the CPU-bound hashing to a
`worker_threads` worker so the main event loop keeps serving traffic, and
**prove** the responsiveness with a test.

## Requirements

- `checksum(payload, rounds)` — the reference implementation, on the calling
  thread: SHA-256 hex digest of the payload, re-hashed `rounds` times
  (`rounds` ≥ 1; round N hashes the hex digest of round N−1). This is the
  blocking baseline.
- `checksumInWorker(payload, rounds?)` returns a promise of the identical
  digest, computed on a `worker_threads` worker so the main thread never
  blocks. Default `rounds` is 1.
- The worker is created inline via `new Worker(code, { eval: true })` — no
  separate worker file, so the whole solution lives in this module and
  survives ts-jest (the eval'd code is plain JS and must not depend on any
  TypeScript machinery).
- Payload travels via `workerData`; the digest comes back in a single
  `message` event.
- Errors inside the worker reject the promise (message included); a worker
  that exits with a nonzero code without posting a result also rejects.
- Every call must clean up after itself: no dangling workers or handles that
  keep the process (or jest) alive.
- Invalid `rounds` (< 1 or non-integer) rejects without ever spawning a
  worker.
- The responsiveness test contract: while `checksumInWorker` crunches a heavy
  payload, a short `setInterval` on the main thread must keep ticking. The
  same workload run through the blocking `checksum` on the main thread is the
  contrast case.

## Example

```ts
const digest = await checksumInWorker(archiveBytes.toString('base64'), 50_000);
// main thread stayed responsive the whole time
digest === checksum(archiveBytes.toString('base64'), 50_000); // true
```

## Target

35–45 minutes. The senior signals: knowing what actually transfers via
`workerData` (structured clone, not shared memory), settling the promise
exactly once across `message`/`error`/`exit` races, and articulating when a
worker is worth its ~ms spawn cost (rule of thumb: CPU work > a few ms, or
anything iterated).

## Interviewer follow-up

Spawning one worker per checksum wastes ~10ms and unbounded memory under
load. Sketch the worker-pool version: how many workers, how do you route
results back to the right caller, and what happens to queued checksums during
the graceful shutdown you built in task 007?
