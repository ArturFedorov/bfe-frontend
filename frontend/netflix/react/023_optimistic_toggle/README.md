# 023. Optimistic Toggle

**Difficulty:** Hard
**Topics:** Optimistic Updates, Rollback, Announced Errors

---

## Scenario

The partner settings page has feature-flag switches ("Enable auto-QC",
"Allow 4K uploads"). The flag API is slow (~2s), and waiting for the round
trip before flipping the switch made the page feel broken — so product wants
optimistic updates: flip instantly, save in the background. But when the save
fails, the switch must roll back to reality and tell the user why, and a
successful save must not cause any flicker (the switch never re-flips).

## Acceptance Criteria

- Renders a switch (`role="switch"`) whose accessible name is the `label`
  prop and whose `aria-checked` reflects the current value, starting from
  `initialEnabled`.
- Clicking flips `aria-checked` immediately — before `updateFlag` settles —
  and calls `updateFlag` with the new boolean exactly once.
- On success the switch keeps the new value (no flicker: `aria-checked` is
  already correct the moment the promise resolves and never reverts).
- On failure the switch rolls back to the previous value and an error message
  `"Could not update <label>"` is announced via `role="alert"`.
- Clicks while a save is in flight are ignored (`updateFlag` not called
  again) — no queueing, no double-fires.
- Starting a new attempt after a failure clears the error; a retry can
  succeed and the switch keeps the optimistic value.
- A11y: `role="switch"` + `aria-checked`, accessible name from the label,
  rollback error announced with `role="alert"`.

## Example

```tsx
<OptimisticToggle
  label="Enable auto-QC"
  initialEnabled={false}
  updateFlag={(enabled) => api.setFlag('partner-42', 'auto-qc', enabled)}
/>
// click → aria-checked=true instantly → reject → aria-checked=false + alert
```

## Target

25–35 minutes. Senior signals: the optimistic value captured before the await
(so rollback restores the right state), an in-flight ref guard, and asserting
"no flicker" as an observable behaviour rather than an implementation detail.

## Interviewer follow-up

Two switches share one partner record and the API rejects concurrent writes.
How would you generalize this into a `useOptimisticMutation` hook with a
per-key mutation queue, and what happens to rollback when mutations pipeline?
