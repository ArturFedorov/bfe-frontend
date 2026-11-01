# 004. Last Updated Clock

**Difficulty:** Easy
**Topics:** useEffect, setInterval, Cleanup, Stale Closures

---

## Scenario

Every card on the integration monitoring dashboard shows when its data was last
refreshed — "Updated 12s ago" — and the number has to keep counting up in place
so on-call engineers can spot a stalled feed at a glance. A previous attempt
shipped two classic bugs: the interval kept running after the card unmounted,
and after a refresh the label kept counting from the old timestamp because the
tick callback had closed over stale props. Rebuild the ticker with correct
effect hygiene.

## Acceptance Criteria

- Renders an element with `role="timer"` whose text is `Updated <n>s ago`,
  where `<n>` is whole seconds elapsed since the `updatedAt` timestamp (epoch
  ms), never negative.
- Re-renders on an interval (default every 1000 ms, configurable via `tickMs`)
  so the number counts up without any prop changes.
- When `updatedAt` changes (a refresh landed), the very next render reflects
  the new timestamp — no stale-closure leftovers from the old one.
- Unmounting clears the interval: no timers left running, no state updates
  after unmount.
- The elapsed time is computed from the current time at each tick, not by
  incrementing a counter.

## Example

```ts
<LastUpdatedClock updatedAt={lastSyncEpochMs} />
// renders: Updated 5s ago ... a second later: Updated 6s ago

<LastUpdatedClock updatedAt={lastSyncEpochMs} tickMs={500} />
```

## Target

The interval is created once per configuration, always cleaned up, and every tick reads fresh time and fresh props — no stale closures, no leaks.

## Interviewer follow-up

Why would `setInterval(() => setSeconds(seconds + 1), 1000)` inside the effect
freeze at 1, and what are two different ways to fix it?
