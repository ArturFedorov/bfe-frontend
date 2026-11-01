# 084. Review Queue with Lease Heartbeat

**Difficulty:** Hard
**Estimated time:** 60 min
**Topics:** Async Effects, Intervals & Cleanup, Prefetching, Optimistic UI, Idempotent Actions, Hotkeys, Error Mapping

---

## Scenario

QA analysts on the ML data-annotation platform review annotated items one at a time. The
server hands out each task under a short **lease** so two analysts never review the same
item; the client must heartbeat (`renew`) to keep the lease alive and the server returns the
task to the queue when the heartbeat stops. The first version waited for the network between
every decision (reviewers idle for a second per item), kept heartbeating a task that had
already been submitted, double-submitted when a reviewer hit the hotkey twice, and showed a
raw `409` when a lease lapsed. Build `ReviewQueue`: lease heartbeat, one-task prefetch,
optimistic decisions, double-submit protection and lease-expiry messaging.

## Requirements

1. On mount call `api.next()` once. While it is pending render `role="status"` with
   `Loading…`; the decision buttons are disabled. When it resolves with a task, render its
   `text` and four enabled buttons: `Approve`, `Reject`, `Skip`, `Flag`. When it resolves
   with `null`, render `role="status"` with `Queue empty` (buttons disabled).
2. Heartbeat: while a task is shown, call `api.renew(task.id)` every `heartbeatMs`
   (default 15000). The interval starts fresh when the shown task changes, only ever
   renews the task currently shown, and is cleared on unmount or when no task is shown.
3. Prefetch: as soon as a task is shown, call `api.next()` exactly once more and **hold** the
   result without displaying it. Never issue a second prefetch for the same shown task.
4. Decision (button or hotkey): call `api.submit(task.id, decision)` and advance
   **optimistically**, without awaiting it:
   - if the prefetched task has already resolved, show it immediately and start the next
     prefetch;
   - if the prefetch is still in flight, show `Loading…` and display the task when it
     resolves (do not call `next()` again for it);
   - if the prefetch resolved with `null`, show `Queue empty`.
5. Double-submit safety: at most one `submit` per task id. A second decision for the same
   task — click, hotkey, or both in the same tick — is ignored, even before the first
   `submit` settles.
6. Submit failures surface in `role="alert"` and the reviewer keeps going on the next task:
   - rejection whose `code === 'lease_expired'` → exactly
     `Your lease on task <id> expired — it was returned to the queue`;
   - any other rejection → its `message`.
   The alert is cleared by the next decision. Rejections arriving after unmount are
   ignored (no state updates, no unhandled rejection).
7. Hotkeys on `window`, case-insensitive: `A` approve, `R` reject, `S` skip, `F` flag.
   Ignored while focus is inside an `input`, `textarea`, `select` or contenteditable, while
   loading/empty, when a modifier (Ctrl/Meta/Alt) is held, and after unmount.

## Acceptance Criteria

- [ ] `next()` called once on mount; `Loading…` status; buttons disabled.
- [ ] Task text + four enabled buttons after resolve; `Queue empty` on `null` and no prefetch.
- [ ] Prefetch issued exactly once per shown task and held (not displayed).
- [ ] `renew(id)` fires every `heartbeatMs` (default 15000), stops on unmount, and after a
      task change only the new id is renewed on a fresh interval.
- [ ] Each button/hotkey submits the right decision for the shown task.
- [ ] Next task visible while `submit` still pending; `Loading…` when prefetch in flight,
      then the task; `Queue empty` after the last task.
- [ ] Two decisions in the same tick → one `submit`.
- [ ] `lease_expired` → exact alert text; other errors → message; cleared on next decision.
- [ ] Hotkeys ignored in a text input, while loading/empty, and after unmount.

## Baseline a11y

- Loading/empty states use `role="status"`; failures use `role="alert"`.
- Decision controls are real `<button>`s with visible text names; disabled when no task.
- Each button declares its hotkey via `aria-keyshortcuts`.
- Hotkeys never steal keystrokes from form controls.

## Constraints

- No third-party libraries. The `api` object is the only I/O boundary — no `fetch`.
- Never await `submit` before advancing; never issue two concurrent `next()` prefetches.

## Interviewer follow-ups (talk-through, not implemented)

- The server also emits the lease expiry time (`leaseExpiresAt`). How would you warn the
  reviewer 10s before expiry and auto-release instead of heartbeating forever on an idle tab
  (`visibilitychange`, idle detection)?
- Offline for 30s: queue the decisions locally and replay in order on reconnect — how do you
  keep idempotency (client-generated decision ids) and reconcile `lease_expired` replies?
- `renew` starts failing (401/5xx): back off, surface a banner, and stop the reviewer from
  spending effort on a task they no longer own.
- Prefetch depth 2–3 for slow networks: what changes in the state shape, and how do you
  avoid leasing tasks nobody will review before they expire?

## Say out loud

- State shape first: `view: {status:'loading'} | {status:'task', task} | {status:'empty'}`,
  a held `prefetch` (promise + settled value), a `decided` set of task ids, and `error`.
- Race/cleanup hazard: the heartbeat interval must be keyed on the shown task id; the
  initial fetch, prefetch and submit callbacks must check an alive flag after unmount.
- Data-shape question: does `next()` on an empty queue return `null` or reject, and can the
  server return the same task id twice (after a lease expiry)?
- Failure-handling question: when `submit` fails with `lease_expired`, should the item be
  shown again to this reviewer or only announced?
- First test you'd write: `next()` called once on mount, then once more only after the first
  task is shown.
