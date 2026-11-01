# 022. Polling Status Widget

**Difficulty:** Medium
**Topics:** Polling, Overlap Prevention, Error Backoff, Terminal States

---

## Scenario

When a partner triggers a content ingestion, the delivery page shows a live
status widget that polls the ingestion API every 5 seconds. The first version
used a naive `setInterval(fetch, 5000)`: on a slow API, requests piled up and
arrived out of order, it hammered the API twice as fast during outages, and it
kept polling forever after the ingestion finished. Build the polling loop that
schedules the next request only after the previous one settles.

## Acceptance Criteria

- Polls the injected `fetchStatus` prop immediately on mount, then schedules
  the next poll `intervalMs` (default 5000) after each response settles —
  requests never overlap: while one is in flight, no timer can fire another.
- Shows the latest status as `'Status: <value>'` with `role="status"`; shows
  `'Waiting for status…'` before the first response.
- On a rejected poll: keeps showing the last known status, renders
  `'Connection lost — retrying'` with `role="alert"`, and doubles the delay
  for each consecutive error (intervalMs × 2, × 4, …, capped at
  `maxIntervalMs`). A successful poll clears the alert and resets the delay.
- Stops polling permanently when a terminal status arrives (`'succeeded'` or
  `'failed'`) and renders `'Polling stopped'`.
- Unmount cancels the loop: no further fetches, no state updates.
- A11y: live status via `role="status"`, errors via `role="alert"`.

## Example

```tsx
<PollingStatusWidget
  fetchStatus={() => api.getIngestionStatus('ing-123')}
  intervalMs={5000}
/>
// t=0 poll → 'processing' → t=5s poll → error → t=15s poll (10s backoff) …
// → 'succeeded' → polling stops
```

## Target

30–40 minutes. Senior signals: the settle-then-schedule loop (a recursive
`setTimeout`, not `setInterval`), a cancelled flag in the effect closure, and
backoff/terminal logic that lives in one place.

## Interviewer follow-up

The tab is often backgrounded for minutes. How would you pause polling while
`document.visibilityState === 'hidden'` and poll immediately on return —
without introducing overlap or double timers?
