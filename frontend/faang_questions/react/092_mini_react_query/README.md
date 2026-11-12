# 092. Mini React Query

**Difficulty:** Hard
**Estimated time:** 60 minutes
**Topics:** Cache Design, useSyncExternalStore, Request Dedupe, Stale-While-Revalidate, Optimistic Updates

---

## Scenario

The marketing-automation console shows the same campaign list in the sidebar,
the approvals queue and the dashboard. Each panel fetches on its own, so a
single page load fires three identical requests, an approval in one panel
leaves the others stale, and a slow response for an already-invalidated
request sometimes overwrites fresher data. Build a tiny data-fetching layer
with a shared cache so every panel sees one request, one source of truth, and
updates propagate instantly.

Everything is in `mini_react_query.tsx`: a client, a provider, `useQuery`,
`useMutation` and the pure `hashQueryKey`. The tests drive fetches with
deferreds and fake timers.

## Requirements

1. `hashQueryKey(key)` returns a stable string: arrays are order-sensitive,
   plain objects serialize with sorted keys (recursively), and `1` and `'1'`
   hash differently. The cache is keyed by this hash.
2. `useQuery({ queryKey, queryFn, staleTime = 0, enabled = true })` without
   cached data reports `status: 'loading'` and `isFetching: true` on the first
   render, calls `queryFn` once, then reports `status: 'success'` with `data`.
3. `enabled: false` → `status: 'idle'`, `queryFn` never called. Flipping to
   `true` later starts the fetch.
4. A rejected `queryFn` → `status: 'error'` with the `Error` in `error`;
   previously cached `data` is kept (in the hook and in the client).
5. Dedupe: two mounted components with the same hashed key (regardless of
   object key order) share one in-flight request and one cache entry.
6. Stale-while-revalidate: mounting with cached data shows that data
   immediately with `status: 'success'`. If the entry is older than
   `staleTime` (or was invalidated) a background refetch starts
   (`isFetching: true` meanwhile) and the result replaces the data; otherwise
   no request is made.
7. `client.invalidateQueries(prefix)` marks every entry whose key starts with
   `prefix` (element-wise, by hash) as stale; entries with mounted observers
   refetch immediately, entries without observers only get
   `isInvalidated: true` and refetch on their next mount even inside
   `staleTime`. Returns a promise that settles with the triggered refetches.
8. Request counter per key: a response from a request that was superseded by
   a later one (invalidate or `refetch` while in flight) is dropped — it must
   neither overwrite newer data nor clear `isFetching` while the newest
   request is still pending.
9. `client.setQueryData(key, valueOrUpdater)` writes the cache, sets
   `status: 'success'`, and re-renders every observer of that key
   synchronously (inside the same `act`). Observers of other keys do not
   re-render.
10. Unmounted observers receive no updates and cause no `console.error`; the
    entry stays in the cache (a late response still lands in it) so a remount
    within `staleTime` shows the data with no new request.
11. `useMutation({ mutationFn, onMutate?, onError?, onSuccess?, onSettled? })`
    returns `{ mutate, status, error }`. `mutate(vars)` sets `status:
    'loading'`, awaits `onMutate(vars)` for a context, awaits `mutationFn`,
    then calls `onSuccess(data, vars, ctx)` or `onError(error, vars, ctx)`,
    then `onSettled(data, error, vars, ctx)`, and ends in `success` / `error`.
    `mutate` never rejects.
12. The optimistic recipe must work end to end: `onMutate` snapshots the list
    with `getQueryData`, writes with `setQueryData` (visible before the server
    answers), `onError` restores the snapshot from the context, `onSettled`
    invalidates so the server's truth wins.

## Acceptance Criteria

- [ ] `hashQueryKey`: object key order irrelevant, array order relevant,
      `1` ≠ `'1'`, nested objects normalised.
- [ ] First fetch: `loading` + `isFetching`, one `queryFn` call, `success`
      with data; `getQueryData` returns the same data.
- [ ] `enabled: false` → `idle`, no call; enabling later fetches.
- [ ] Error path: `status: 'error'`, `error.message` rendered by the consumer,
      previous data retained.
- [ ] Dedupe: two observers, one `queryFn` call, both render the data.
- [ ] Remount within `staleTime`: `success`, data shown, no new call.
- [ ] Remount after `staleTime`: data shown instantly, `isFetching` true, second
      call, new data replaces old.
- [ ] `invalidateQueries(['campaigns'])` refetches observed matching entries,
      only flags unobserved ones, ignores non-matching keys; the flagged entry
      refetches on next mount.
- [ ] Superseded response arriving after the newer one is ignored.
- [ ] Superseded response arriving before the newer one is dropped and
      `isFetching` stays true.
- [ ] `setQueryData` re-renders exactly the observers of that key, synchronously.
- [ ] Unmounted observer: no `console.error`, cache keeps the late result,
      remount shows it without a request.
- [ ] Mutation success: `idle → loading → success`, optimistic write visible
      during `loading`, `onSettled` triggers the refetch.
- [ ] Mutation failure: `error` with message, optimistic write rolled back from
      the context, `onSettled` still invalidates.

## Baseline a11y

This task is a data layer; the a11y surface belongs to the consumers in the
tests. They render query status in a `role="status"` region, errors in a
`role="alert"`, and the lists as real `<ul>/<li>`. Keep the hook API such
that those consumers do not need effects to mirror state.

## Constraints

- React + TypeScript only; no third-party libraries.
- Subscribe components with `useSyncExternalStore` (no `useEffect` +
  `setState` mirrors). Snapshots must be referentially stable between
  changes.
- Do not change the exported types or signatures. `QueryClient` is the public
  surface; internals (observer sets, request counters, in-flight promises)
  live behind `createQueryClient`.
- Use `Date.now()` for freshness so fake timers control it.

## Interviewer follow-ups (talk-through, not implemented)

- Garbage collection: when does an entry with zero observers leave the cache
  (`gcTime`), and how do you avoid deleting an entry a late response is about
  to write?
- `refetchOnWindowFocus` and `refetchOnReconnect`: where do the listeners
  live so they are registered once per client, not once per hook?
- Suspense: what changes in `useQuery` if it should throw the in-flight
  promise, and how do you avoid an infinite loop on error?
- Pagination / infinite queries: how would the cache entry shape change to
  hold pages and the cursors between them?

## Say out loud

- State shape first: one entry per hashed key —
  `{ data, error, status, isFetching, updatedAt, isInvalidated }` plus
  non-rendered bookkeeping `{ listeners, requestId, inFlight, queryFn }`.
- Name the race/cleanup hazard: a response for request `n` must be dropped
  when `entry.requestId !== n`; unsubscribe on unmount so late writes notify
  nobody but still land in the cache.
- Ask one data-shape question: "Can query keys contain `undefined`, `Date`
  or `Map` values, or only JSON-serializable data?"
- Ask one failure-handling question: "On a failed background refetch, should
  the consumer see `status: 'error'` or keep `'success'` and expose the error
  separately?"
- Name the first test you'd write: "Two components with the same key mount
  together and `queryFn` is called once."
