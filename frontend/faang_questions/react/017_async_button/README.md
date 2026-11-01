# 017. Async Button

**Difficulty:** Easy
**Topics:** Async State, Double-Submit Guard, Error Recovery

---

## Scenario

The partner delivery dashboard has a "Sync now" button that kicks off a manual
sync with a partner's content pipeline. Ops keep double-clicking it and firing
two syncs at once, and when the sync fails there is no feedback — the page just
sits there. Build the button properly.

## Acceptance Criteria

- Renders a button with the `label` prop as its accessible name.
- Clicking it calls `onSync` exactly once and switches the button to the
  pending label (default `'Syncing…'`) while the promise is in flight.
- The button is disabled while pending — clicking again during a pending sync
  must NOT call `onSync` a second time.
- When `onSync` resolves, the button returns to its idle label and is enabled.
- When `onSync` rejects, an error message (default `'Sync failed. Try again.'`)
  is rendered with `role="alert"` so screen readers announce it, and the button
  is re-enabled for a retry.
- Starting a new sync clears the previous error message.
- A11y: real `<button>`, accessible name always present, error uses `role="alert"`.

## Example

```tsx
<AsyncButton label="Sync now" onSync={() => api.triggerSync('partner-42')} />
// click → button reads "Syncing…" and is disabled
// resolve → back to "Sync now"
// reject → "Sync now" enabled again + role="alert" error below it
```

## Target

10–15 minutes. The senior signals: the double-submit guard, pending state
derived from the promise lifecycle (not a timeout), and the announced error.

## Interviewer follow-up

The sync sometimes resolves after the user has navigated away and the button
has unmounted. What warning does React log, and how would you make the
component unmount-safe without suppressing the warning?
