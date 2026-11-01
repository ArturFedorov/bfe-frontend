# 012. useFetch

**Difficulty:** Medium
**Topics:** Custom Hooks, AbortController, Race Conditions, Effect Cleanup

---

## Scenario

Every detail pane in the partner portal fetches JSON from an internal API, and
every one of them has reinvented loading flags — several with the classic bug:
click partner A, click partner B, and A's slow response lands last and
overwrites B's data. Build the one `useFetch(url)` hook the team standardizes
on, with cancellation done properly via `AbortController`.

## Acceptance Criteria

- `useFetch<T>(url)` returns `{ data, error, loading, refetch }`.
- On mount and whenever `url` changes, it fetches `url`, passing an
  `AbortController`'s `signal` in the fetch init.
- States are mutually exclusive: `loading: true` with `data: null` and
  `error: null` while in flight; on success `data` is the parsed JSON body; a
  non-`ok` response or a rejected fetch produces an `Error` in `error`.
- Changing `url` **aborts** the in-flight request (its signal becomes
  aborted) and starts a new one; a stale response settling afterwards must
  never update state.
- Unmounting aborts the in-flight request; nothing updates state after
  unmount.
- `refetch()` re-runs the request for the current `url` (entering `loading`
  again) and has a stable function identity across renders.

## Example

```ts
function PartnerDetail({ partnerId }: { partnerId: string }) {
  const { data, error, loading, refetch } = useFetch<Partner>(`/api/partners/${partnerId}`);

  if (loading) return <p role="status">Loading partner…</p>;
  if (error) return <button onClick={refetch}>Retry: {error.message}</button>;
  return <h2>{data?.name}</h2>;
}
```

## Target

One effect keyed on `[url, tick]` owning a single `AbortController`; cleanup
is `controller.abort()`, and every state write is guarded by
`signal.aborted`.

## Interviewer follow-up

Two components on the same page call `useFetch('/api/regions')` — you now
have duplicate requests. How would you add request de-duplication or a cache
without breaking the abort-on-unmount guarantee for the remaining consumer?
