# 021. Retry Panel

**Difficulty:** Medium
**Topics:** Auto-Retry, Exponential Backoff, Timer Cleanup

---

## Scenario

The integration health page runs a connectivity check against each partner's
endpoint. Checks fail all the time (partner-side maintenance windows), so the
panel must retry automatically — but politely: an on-screen countdown shows
when the next attempt happens, the delay doubles after each consecutive
failure, and an ops engineer can always smash "Retry now". The old version
kept retrying after the panel unmounted and DDoS'd a partner overnight.

## Acceptance Criteria

- Runs `runCheck` once on mount, showing `'Checking integration…'` with
  `role="status"` while the promise is pending.
- On success, shows the resolved message with `role="status"`; no countdown,
  no further checks.
- On failure, shows the rejection's message with `role="alert"`, plus a
  countdown `'Retrying in Ns'` that starts at `initialDelayMs / 1000` and
  ticks down once per second.
- When the countdown reaches 0, retries automatically. Each consecutive
  failure multiplies the delay by `backoffFactor` (default 2), capped at
  `maxDelayMs` — e.g. 3s → 6s → 12s.
- A `'Retry now'` button is shown while waiting and triggers an immediate
  retry.
- A success resets the failure streak (alert and countdown disappear).
- Unmounting cancels everything: no further `runCheck` calls, no timer ticks,
  no state updates after unmount.
- A11y: pending/success via `role="status"`, failures via `role="alert"`,
  manual retry is a real button.

## Example

```tsx
<RetryPanel
  runCheck={() => api.checkIntegration('partner-42')}
  initialDelayMs={3000}
/>
// reject → alert + "Retrying in 3s" → 2s → 1s → auto retry
// reject again → "Retrying in 6s"
```

## Target

30–40 minutes. Senior signals: countdown as state driven by a 1s timeout with
cleanup (not `setInterval` + math), failure streak in a ref, and the
unmount-cancellation path actually tested.

## Interviewer follow-up

Your countdown re-arms a 1-second `setTimeout` on every tick. What drift
problem does that have on a real clock, and how would you drive the display
from `Date.now()` deltas instead while keeping the same tests passing?
