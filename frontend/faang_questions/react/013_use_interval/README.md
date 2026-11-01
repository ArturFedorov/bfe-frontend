# 013. useInterval

**Difficulty:** Medium
**Topics:** Custom Hooks, Refs, Latest-Callback Pattern, Timers

---

## Scenario

The integration monitoring wall refreshes each status tile every few seconds.
The naive `useEffect(() => setInterval(cb, ms), [])` ships a stale closure —
tiles kept polling with the filter values from mount. And putting `cb` in the
dependency array tears the interval down on every render, so ticks never fire
on a busy dashboard. Build Dan Abramov's `useInterval(callback, ms)` with the
latest-callback ref pattern, plus `ms = null` to pause polling while a tile's
detail modal is open.

## Acceptance Criteria

- `useInterval(callback, ms)` invokes `callback` every `ms` milliseconds.
- **Latest-callback semantics:** the tick always invokes the most recently
  rendered `callback`. Swapping the callback between ticks does **not** reset
  the interval timer — the next tick fires on the original schedule and calls
  the new callback.
- `ms = null` pauses: no interval is scheduled, and switching from a number to
  `null` clears the running interval.
- Changing `ms` to a different number restarts the interval with the new
  period.
- Unmounting clears the interval — no leaked timers, no further calls.
- The hook returns `void`.

## Example

```ts
function StatusTile({ integrationId, paused }: { integrationId: string; paused: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);

  useInterval(async () => {
    setStatus(await fetchStatus(integrationId));
  }, paused ? null : 5000);

  return <span role="status">{status?.label ?? 'unknown'}</span>;
}
```

## Target

Two effects: one that mirrors `callback` into a ref, one keyed on `[ms]` that
schedules `setInterval(() => ref.current(), ms)` and clears it in cleanup.

## Interviewer follow-up

The poll itself takes longer than `ms`, so ticks now overlap in-flight
requests. How would you turn this into a self-scheduling `useTimeout` chain
that waits for each poll to finish before scheduling the next?
