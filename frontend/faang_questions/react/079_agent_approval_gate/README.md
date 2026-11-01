# 079. Agent Approval Gate

**Difficulty:** Hard · **Priority:** P1
**Estimated time:** 60 min
**Topics:** Human-in-the-loop UI, exactly-once submission, in-flight guards, countdown with fake timers, prop-driven reset, line diff

---

## Scenario

The pre-annotation agent can propose destructive actions — "relabel 340 items
from `car` to `vehicle`", "delete 12 duplicate bounding boxes". The run pauses
on a `requires_approval` event and a QA analyst must approve, reject, or edit
the proposed action before the agent continues. The server gives each request a
deadline; after it the run is auto-rejected.

The first version sent two decisions when the analyst double-clicked, kept
showing an enabled Approve button after the deadline had passed, and reset to a
blank form — losing the in-flight decision — whenever the event stream
reconnected and replayed the same `requires_approval` event.

Build the gate so that exactly one decision is sent, the deadline is honoured,
and a reconnect replay is harmless.

## API

```tsx
export interface ApprovalRequest {
  id: string;
  action: string;      // human-readable summary, e.g. "Relabel 340 items"
  proposed: string;    // multi-line, the action the agent wants to take
  current: string;     // multi-line, what exists today
  expiresAt: number;   // epoch ms
}

export type ApprovalDecision =
  | { requestId: string; kind: 'approve' | 'reject' }
  | { requestId: string; kind: 'approve_edited'; proposed: string };

<ApprovalGate request={ApprovalRequest | null} onDecide={(decision: ApprovalDecision) => Promise<void>} />
```

## Requirements

1. `request === null` → render nothing (no dialog in the DOM).
2. With a request: `role="dialog"` with accessible name `Approval required`,
   showing `request.action`.
3. A line diff of `current` vs `proposed` rendered as a list with
   `aria-label="Diff"`. Split both on `\n`. Each `listitem` carries
   `data-change`: `removed` for a line only in `current`, `added` for a line
   only in `proposed`, `same` for a line in both. Set membership is enough
   (no LCS needed); lines of `current` appear in their order, added lines in
   `proposed` order.
4. Buttons named `Approve`, `Reject`, `Edit`.
   - `Approve` → `onDecide({ requestId, kind: 'approve' })`.
   - `Reject` → `onDecide({ requestId, kind: 'reject' })` (even while editing).
   - `Edit` reveals a textarea labelled `Proposed action`, prefilled with
     `proposed`. Once editing, `Approve` sends
     `{ kind: 'approve_edited', proposed: <textarea value> }`.
5. **Exactly once.** While the `onDecide` promise is pending the dialog has
   `aria-busy="true"` and all three buttons are disabled; extra clicks never
   call `onDecide` again. After it resolves, `role="status"` reads
   `Decision sent` and the buttons remain disabled (or are removed).
6. **Countdown.** `role="status"` shows `Expires in Ns` where
   `N = ceil((expiresAt - Date.now()) / 1000)`, updating every second. When the
   remaining time reaches `0` the buttons disable and `role="alert"` reads
   `Expired`.
7. A decision already in flight when the deadline passes is **not** interrupted:
   no `Expired` alert appears, and on resolve the status reads `Decision sent`.
8. **Reconnect recovery.** If `request` changes to a new object with the
   **same `id`** while a decision is pending or sent, keep the pending/sent
   state — do not re-enable buttons and do not call `onDecide` again. If the
   `id` differs, reset fully to the new request (buttons enabled, editor closed,
   countdown from the new `expiresAt`). A late resolution of the **old**
   request's promise must not mark the new request as sent.
9. `onDecide` rejection → `role="alert"` with the error's message, buttons
   re-enabled, `aria-busy` cleared; a retry calls `onDecide` again.
10. Unmounting while a decision is pending causes no errors when it settles.

## Acceptance criteria

- [ ] Null request renders no dialog; a request renders a dialog named `Approval required` showing `action`.
- [ ] Diff list labelled `Diff` with correct `data-change` for removed / added / same lines.
- [ ] Approve sends `approve`; Reject sends `reject`; both carry the request id.
- [ ] Edit reveals the `Proposed action` textarea prefilled with `proposed`; Approve then sends `approve_edited` with the edited text.
- [ ] Reject while editing still sends `reject`.
- [ ] Pending: `aria-busy="true"`, all buttons disabled, double-click calls `onDecide` once (senior).
- [ ] Resolved: status `Decision sent`; a further click never calls `onDecide`.
- [ ] Countdown `Expires in 5s` → `4s` after one second → `Expired` alert and disabled buttons at the deadline.
- [ ] A decision pending across the deadline completes with `Decision sent` and no `Expired` alert (senior).
- [ ] Same-id replay during pending: no reset, no second `onDecide`; resolve → `Decision sent` (senior).
- [ ] Different id: full reset; the old request's late resolution does not mark the new one sent (senior).
- [ ] Rejection → alert with message, buttons enabled, retry calls `onDecide` again.
- [ ] Approve is operable with keyboard (`Enter` on the focused button).
- [ ] Unmount while pending, then settle → no `console.error`.

## Baseline a11y (graded inline)

- `role="dialog"` with an accessible name (`aria-label` or `aria-labelledby`).
- Textarea has a visible, associated label (`Proposed action`).
- Countdown and `Decision sent` live in `role="status"`; `Expired` and errors in `role="alert"`.
- Buttons are native `<button>` elements, disabled via the `disabled` attribute.

## Constraints

- No third-party libraries (no diff library — a set-based line diff is fine).
- Use `Date.now()` for the countdown so tests can control time with
  `jest.useFakeTimers()` + `jest.setSystemTime()`.
- Decide what "pending" means with a ref, not only React state, so two clicks
  inside one event loop turn cannot both pass the guard.

## Interviewer follow-ups (talk through, do not implement)

- The server sends an explicit `approval_expired` event as well as the local deadline. Which wins when they disagree, and how do you avoid showing `Expired` and then `Decision sent`?
- The onDecide call times out (no resolve, no reject). When do you let the analyst retry, and how do you avoid a duplicate decision on the server?
- Several approval requests can queue up during one run. How does the API change — a list and a "current" pointer, or one gate per request?
- The edited `proposed` text may be huge. How would you show the diff of the edited text versus `current` live while typing, cheaply?

## Say out loud (before typing)

- **State shape first:** `phase: { kind: 'idle' } | { kind: 'pending' } | { kind: 'sent' } | { kind: 'error'; message } `, plus `editing`, `draft`, and `now` for the countdown; `expired` is derived.
- **Race / cleanup hazard:** a promise resolving after the request id changed or after unmount must be ignored — compare the decision's `requestId` with the current one, and clear the interval on unmount / id change.
- **One data-shape question:** is `expiresAt` server time or client time — do we need a clock-skew offset?
- **One failure-handling question:** on rejection, is the request still valid on the server, or should a retry be blocked until a fresh `requires_approval` arrives?
- **First test you'd write:** "double-clicking Approve calls onDecide exactly once."
