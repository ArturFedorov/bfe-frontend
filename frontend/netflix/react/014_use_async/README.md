# 014. useAsync

**Difficulty:** Medium
**Topics:** Custom Hooks, State Machines, Race Conditions, Refs

---

## Scenario

"Validate credentials", "Trigger sync", "Re-run delivery check" — every action
button in the partner portal wraps some async call and hand-rolls its own
`isLoading` / `error` pair, usually with impossible states (`loading && error`)
and always with the same race: click "Re-run" twice, and the slow first run
settles last and stomps the fresh result. Build `useAsync(fn)`: an explicit
idle/loading/success/error state machine around any promise-returning
function, where only the **latest** run may settle into state.

## Acceptance Criteria

- `useAsync<T, Args>(fn)` returns `{ status, data, error, run }` where
  `status` is `'idle' | 'loading' | 'success' | 'error'`.
- Initial state: `status: 'idle'`, `data: null`, `error: null`.
- `run(...args)` calls `fn(...args)`, moves to `loading` (clearing previous
  `data`/`error`), then to `success` with `data` or `error` with an `Error`.
- **Stale settlements are ignored:** if `run()` is called again while a
  previous run is in flight, the earlier run's resolution *and* rejection are
  discarded — only the latest run may write state.
- `run` never throws to the caller (rejections are captured into state) and
  returns a promise that settles when the run is fully processed.
- `run` has a stable identity across re-renders, and always invokes the
  latest `fn` passed to the hook.

## Example

```ts
function SyncNowButton({ partnerId }: { partnerId: string }) {
  const { status, error, run } = useAsync(() => triggerSync(partnerId));
  return (
    <>
      <button onClick={() => run()} disabled={status === 'loading'}>
        {status === 'loading' ? 'Syncing…' : 'Sync now'}
      </button>
      {status === 'error' && <p role="alert">{error?.message}</p>}
    </>
  );
}
```

## Target

A monotonically increasing run-id in a ref; each settlement compares its
captured id against the current one and bails if it lost.

## Interviewer follow-up

The team wants the *previous* successful `data` kept visible while a re-run
is loading (stale-while-revalidate). Which acceptance criterion changes, and
what impossible states does that reintroduce if you're not careful?
