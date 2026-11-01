# 080. Cancel and Resume Run

**Difficulty:** Hard
**Estimated time:** 60 minutes
**Topics:** Agentic UI, AbortController, Stale-Run Guard, Persistence, Snapshot Reconciliation

---

## Scenario

QA analysts on the ML data-annotation platform trigger a "pre-annotate batch"
agent that streams its output while it works. The current page has three
bugs they complain about daily: Cancel only hides the spinner (the stream keeps
appending output behind it), Retry interleaves output from the cancelled run
with the new one, and a browser reload loses the partial output even though the
server still has it. Build the run controller that cancels cleanly, resumes
with a fresh run id, and survives a reload by combining `sessionStorage` with
the server's snapshot.

The stream is injected as `startRun(runId, signal): AsyncIterable<RunEvent>`
so tests can drive it deterministically; treat it exactly like a `fetch`
body decoded to events.

## Requirements

1. Initially (nothing stored) render status `Idle`, an empty output log, and
   a `Start` button. Do not call `startRun`, `snapshot` or write to `storage`.
2. `Start` generates a run id with `newRunId()` (default
   `crypto.randomUUID()`), calls `startRun(runId, signal)` once with a
   non-aborted signal, sets status `Running`, shows a `Cancel` button, and
   appends every `output` chunk to the log by exact string concatenation.
3. A `finished` event sets status `Finished`; `Cancel` disappears and
   `Start` is offered again. Starting again creates a new run id and an empty
   log.
4. `Cancel` aborts the signal, sets status `Cancelled — partial output kept`,
   keeps everything received so far, hides `Cancel`, shows `Resume`, and
   ignores any event the old iterable yields after the abort.
5. `Resume` starts a NEW run id (new `startRun` call, fresh non-aborted
   signal, empty log). Events from the previous iterable that arrive after the
   new run started are dropped (stale-run guard keyed by run id).
6. Persistence: whenever `runId`, `output` or `status` changes (and a run
   exists), write `JSON.stringify({ runId, output, status })` to `storage`
   under the key `run-state` — exactly those three fields.
7. Restore: on mount, if `storage` has a record, render its output and status
   immediately (synchronously, before any promise resolves), then call
   `snapshot()` exactly once and reconcile:
   - same `runId` and the server output is longer → replace the output;
   - server status `finished` → status `Finished`;
   - different `runId`, shorter/equal output, or `null` → keep what is shown.
   A stored record whose status is `running` has no live stream in this tab
   (the reload interrupted it): render it as `Cancelled — partial output kept`
   so `Resume` is available, unless the snapshot reports `finished`.
8. A snapshot that resolves after the user has already started a new run
   must not clobber the new run's output or status.
9. If the iterable throws while running, keep the partial output, set status
   `Cancelled — partial output kept`, show the error message in a
   `role="alert"`, and offer `Resume`. Resuming clears the alert.
10. Unmount aborts the current signal. Late events, a late throw, or a late
    snapshot after unmount cause no state updates, no storage writes and no
    `console.error`.

## Acceptance Criteria

- [ ] Idle render: status `Idle`, empty log, `Start`; no `startRun`, no
      `snapshot`, nothing stored.
- [ ] `Start` → `newRunId` called once, `startRun(runId, signal)` called once,
      `signal.aborted === false`, status `Running`, chunks concatenated in
      order.
- [ ] `finished` → `Finished`, `Cancel` hidden, `Start` returns; a second
      `Start` uses a new run id and an empty log.
- [ ] `Cancel` → signal aborted, status text exactly
      `Cancelled — partial output kept`, output retained, late events from the
      cancelled iterable ignored, `Resume` shown.
- [ ] `Resume` → new run id, new signal (old one aborted), empty log; late
      events from the old iterable do not appear.
- [ ] Storage record equals `{ runId, output, status }` after each chunk, on
      cancel, on finish, and after a new run starts.
- [ ] Stored record renders before the snapshot resolves; `snapshot` called
      exactly once; not called when nothing is stored.
- [ ] Snapshot reconciliation: longer output replaces; `finished` upgrades
      status; different run id / shorter output / `null` ignored.
- [ ] Late snapshot after a new run started is ignored.
- [ ] Throwing stream → partial output kept, `role="alert"` with the message,
      status `Cancelled — partial output kept`, `Resume` offered.
- [ ] Unmount aborts; nothing after unmount logs an error or touches storage.

## Baseline a11y

- Overall state in a `role="status"` element (polite live region).
- Output in an element with `role="log"` accessibly named `Run output`
  (`aria-label`), so screen readers announce appended chunks politely.
- Failures in a `role="alert"`.
- All controls are real `<button>` elements named `Start`, `Cancel`, `Resume`
  and reachable by keyboard; only the controls valid for the current status
  are rendered.

## Constraints

- React + TypeScript only; no third-party libraries.
- Keep the discriminated `RunStatus` as given; do not add statuses. Model the
  error as `cancelled` + an error message.
- `startRun` and `snapshot` are the only I/O boundaries; `storage` is any
  `Storage` implementation (tests pass a Map-backed fake).
- Do not change the exported types or component signature.

## Interviewer follow-ups (talk-through, not implemented)

- The server can resume a run from its own checkpoint. How would you change
  `Resume` to pass the previous `runId` and reconcile the two outputs without
  duplicating chunks?
- Two tabs open the same task. What breaks with `sessionStorage` vs
  `localStorage`, and how would you use the `storage` event or
  `BroadcastChannel` to keep them consistent?
- The output grows to megabytes. Where do you stop persisting the full string,
  and what would the storage record hold instead (offset, byte count, hash)?
- How would you expose this as a `useRun(startRun, snapshot, storage)` hook so
  a second component (a "cost meter") can observe the same run?

## Say out loud

- State shape first: `{ runId: string | null; output: string; status: RunStatus; error: string | null }`
  — one object, so a stale update can be rejected by comparing `runId`.
- Name the race/cleanup hazard: a cancelled or superseded iterable can still
  resolve `next()`; every state update must check `signal.aborted` and the
  current run id, and unmount must abort.
- Ask one data-shape question: "Is `snapshot.output` always a prefix-extension
  of what the client saw, or can the server re-chunk/rewrite earlier output?"
- Ask one failure-handling question: "If `snapshot()` rejects, do we show the
  stored record silently or surface a warning?"
- Name the first test you'd write: "Cancel aborts the signal and events pushed
  afterwards do not change the log."
