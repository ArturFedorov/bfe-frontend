# 007. Graceful Shutdown

**Difficulty:** Medium
**Topics:** Process Lifecycle, SIGTERM Draining, Injectable Timers, Deadlines

---

## Scenario

Every deploy of the report-jobs service kills pods mid-write: Kubernetes sends
SIGTERM, the process dies instantly, and half-written partner reports need
manual cleanup. The fix is a shutdown coordinator: on signal, stop accepting
new jobs, let in-flight work drain, and if the drain blows the deadline,
force-exit anyway (Kubernetes will SIGKILL at 30s regardless — better to go on
your own terms). No real signals or real time in tests — the coordinator takes
injectable timers and is driven entirely by fake clocks.

## Requirements

- `new ShutdownCoordinator({ drainDeadlineMs, onForceExit, timers? })` —
  `timers` defaults to the global `setTimeout`/`clearTimeout` (which jest fake
  timers can drive).
- `track(promise)` registers in-flight work and returns a promise that settles
  like the input. Rejections count as "done draining" too — a failed job must
  not hang shutdown (and must not crash it).
- Once shutdown starts, `track` **rejects immediately** with a
  `ShutdownInProgressError` — the caller (e.g. an HTTP layer) turns that into
  a 503. The rejected work must NOT be added to the drain set.
- `onSignal()` starts the drain and resolves with `'drained'` when the last
  in-flight promise settles, or `'forced'` when the deadline fires first — in
  which case `onForceExit` is called exactly once.
- On a clean drain the deadline timer is **cleared** (no stray timer keeping
  the process alive).
- `onSignal()` with nothing in flight resolves `'drained'` immediately —
  without ever scheduling the deadline timer.
- Calling `onSignal()` twice returns the same promise (idempotent — SIGTERM
  and SIGINT often both arrive).
- Expose `inFlightCount` and `isShuttingDown` for observability.
- `onForceExit` is a callback, not `process.exit` — the coordinator must be
  fully testable in-process.

## Example

```ts
const coordinator = new ShutdownCoordinator({
  drainDeadlineMs: 10_000,
  onForceExit: () => process.exit(1),
});

// per request:
app.handle((req) => coordinator.track(processReport(req)));

// wiring (not under test):
process.on('SIGTERM', async () => {
  const outcome = await coordinator.onSignal(); // 'drained' | 'forced'
  if (outcome === 'drained') process.exit(0);
});
```

## Target

25–30 minutes. The senior signals: the settle-vs-resolve distinction in the
drain set (rejections drain too), clearing the deadline on clean drain, and
idempotent `onSignal`.

## Interviewer follow-up

`track` guards job *execution*, but the HTTP server keeps its listening socket
open, so the load balancer keeps routing new connections during the drain.
What is the correct shutdown ORDER for the socket vs the drain, and where does
`server.close()`'s callback fit in?
