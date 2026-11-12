# Milestone 02. Data Layer — LRU Cache + Query Client

**Difficulty:** Hard
**Estimated time:** 2 evenings
**Topics:** Caching, Stale-While-Revalidate, Request De-duplication, Stale-Response Guard, Optimistic Mutations, `useSyncExternalStore`

---

## Scenario

The Campaigns tab is the busiest screen in Campaign Studio. Today every
component that needs a list of campaigns calls `api.listCampaigns` from its own
`useEffect`: two widgets on the same page fire two identical requests, paging
back to a page you just saw spins again, and a slow page-1 response can land
after page 2 and overwrite it. Marketing ops also want to approve a batch of
campaigns and *see* the status flip immediately, not after a round trip — and
see it flip back, with an explanation, when the server refuses.

Build the data layer the rest of the app will stand on: a small LRU cache with
TTL and load de-duplication, and a tiny React Query — cache, observers,
invalidation and mutations — then rebuild the Campaigns page on top of it.

The shell gives you `shell/api.ts` (a fake backend with injectable latency and
a seeded failure rate) and `shell/store.ts` (`createStore` + `useStore` on
`useSyncExternalStore`); reuse the store pattern if it helps.

## Requirements

### 2a. `lru.ts` — `createLruCache<K, V>({ max, ttlMs?, now? })`

1. `set` inserts or replaces and marks the key most recently used; inserting
   beyond `max` evicts the least recently used entry.
2. `get` returns the value and refreshes recency; `has` does not touch recency.
3. With `ttlMs`, an entry whose age (by `now()`, default `Date.now`) is
   `>= ttlMs` is treated as missing everywhere: `get`/`has` miss, `size` and
   `keys()` exclude it. `set` restarts the clock for that key.
4. `keys()` lists live keys from least to most recently used. `delete` returns
   whether something was removed; `clear` empties the cache.
5. `getOrLoad(key, loader)` returns the cached value if present; otherwise it
   calls `loader(key)` **once**, caches the resolved value and returns it.
   Concurrent calls for the same key during a load share that one promise.
   A rejected load is not cached, the rejection propagates to every waiter,
   and the next call retries.

### 2b. `query.ts` — the query client

6. `hashKey(key)` serialises a key structurally: objects hash the same
   regardless of property order; `1` and `'1'` differ.
7. `createQueryClient({ now? })` keeps a map of cache entries
   (`QueryState`: `data`, `error`, `status`, `isFetching`, `updatedAt`,
   `isInvalidated`). `getQueryData` / `getQueryState` read it;
   `getQueryState` is `undefined` for a never-seen key.
8. `setQueryData(key, valueOrUpdater)` writes `data`, sets `status: 'success'`,
   `updatedAt = now()` and notifies observers **synchronously**. The standalone
   `setQueryData(client, key, updater)` and `invalidateQueries(client, prefix)`
   exports forward to the client.
9. `fetchQuery({ queryKey, queryFn, staleTime })` returns cached data when
   fresh (`now() - updatedAt < staleTime` and not invalidated) and otherwise
   fetches; concurrent calls for the same key share one in-flight request.
10. `invalidateQueries(prefix)` marks every entry whose key starts with
    `prefix` as invalidated, refetches those with mounted observers and
    resolves when those refetches settle. Entries without observers are only
    flagged (they refetch on their next mount).
11. `QueryClientProvider` provides the client; `useQueryClient` throws outside
    it.
12. `useQuery({ queryKey, queryFn, staleTime = 0, enabled = true })`:
    - the request starts synchronously in the mount effect (tests assert
      `queryFn` was called right after `render`);
    - **SWR**: cached data renders immediately with `status: 'success'` and
      `isFetching: true` while a background refetch runs when stale;
    - **de-dupe**: two components observing the same key share one request and
      both update when it settles;
    - **stale-response guard**: when `queryKey` changes mid-flight, the old
      response fills its own cache entry but never changes what the component
      shows;
    - **staleTime**: fresh data is not refetched on mount; once stale it is;
    - `enabled: false` reports `status: 'idle'` and does not fetch;
    - unmount never causes a state update or a `console.error`; a rejected
      `queryFn` lands in the cache as `status: 'error'` with the error.
13. `useMutation({ mutationFn, onMutate, onSuccess, onError, onSettled })`:
    `mutate` resolves after the callbacks ran and never rejects; `mutateAsync`
    rejects with the error. `onMutate` runs first and its return value is the
    `context` passed to the other callbacks — use it for optimistic writes and
    roll them back in `onError`. `status`/`isPending`/`data`/`error` reflect
    the last call; `reset()` returns to `idle`. No state update after unmount.

### 2c. `CampaignsPage.tsx`

14. Renders a `<table>` of campaigns from `useQuery(['campaigns', params],
    () => api.listCampaigns(params))`. Default sort is `updatedAt desc`;
    columns include name and status (status text is the raw enum value, e.g.
    `pending_approval`).
15. A `<select>` labelled `Status` filters by status (plus `all`) and resets to
    page 1. `Prev` / `Next` buttons page; a `role="status"` element reads
    `Page X of Y`; `Prev` is disabled on page 1 and `Next` on the last page.
    Going back to a page you already saw renders from the cache (and may
    revalidate in the background).
16. When `useSession().user.role === 'approver'`, each `pending_approval` row
    has a checkbox named `Select <campaign name>` and the toolbar has an
    `Approve selected` button (disabled with nothing selected). Clicking it
    runs `api.approveCampaigns(ids)` through `useMutation` with an optimistic
    `setQueryData` that flips the selected rows to `scheduled`; on error the
    rows roll back and a `role="alert"` shows the error message; on settle the
    `['campaigns']` prefix is invalidated. Editors see neither checkboxes nor
    the button.

## Acceptance Criteria

- [ ] LRU: eviction order, recency refresh on `get`, `keys()` LRU→MRU, replace
      keeps size.
- [ ] TTL: expired entries miss and are excluded from `size`/`keys()`; `set`
      restarts the clock.
- [ ] `getOrLoad`: one loader call per in-flight key; success cached; failure
      not cached and propagated to every waiter; retry works.
- [ ] `hashKey` structural; `useQueryClient` throws outside the provider.
- [ ] `useQuery`: loading → success, data rendered, `getQueryState` readable.
- [ ] SWR remount: `success|fetching|<cached>` then updated data.
- [ ] Two observers, one `queryFn` call, both update.
- [ ] Stale response for an abandoned key never overwrites the shown data but
      does fill that key's cache.
- [ ] `staleTime` prevents a refetch at 4 999 ms and allows it at 5 000 ms.
- [ ] `setQueryData` is synchronous; `invalidateQueries(prefix)` refetches only
      matching mounted observers and clears `isInvalidated`.
- [ ] `useMutation` optimistic write + rollback; `status`, `error`, `reset`.
- [ ] Unmounted observer: no `console.error`, error stored in the cache.
- [ ] CampaignsPage: first page sorted by `updatedAt desc`, `Page 1 of 4`,
      no approve controls for editors.
- [ ] Status filter narrows rows and resets to page 1.
- [ ] Prev/Next with correct disabled states; page 2 revisits hit the cache.
- [ ] Approver flow: optimistic `scheduled`, rollback + alert on `NETWORK`.

## Baseline a11y

- The list is a real `<table>`; rows are named by their content (tests find
  rows with `getByRole('row', { name: /campaign name/ })`).
- Filter `<select>` has a visible label `Status`.
- Paging state lives in a `role="status"` live region; errors in `role="alert"`.
- Checkboxes have accessible names (`Select <name>`); all controls are real
  `<button>`s and keyboard reachable.

## Constraints

- React + TypeScript only. No new dependencies.
- Do not change exported names or signatures in `lru.ts`, `query.ts` or the
  `CampaignsPage` props — `app/App.tsx` imports them.
- The page reads only through `useQuery`/`useMutation` (no raw `useEffect`
  fetches) and gets the backend via its `api` prop.
- Tests are the grader: `npm run test:campaign -- 02_data_layer`.

## How it plugs into the app

`app/App.tsx` already renders the Campaigns tab as

```tsx
const client = useMemo(() => createQueryClient(), []);
<QueryClientProvider client={client}><CampaignsPage /></QueryClientProvider>
```

inside a `TaskBoundary`, so once `createQueryClient` stops throwing the tab
comes alive. Follow-up (optional, not graded): move `app/Dashboard.tsx` from
its `useEffect` fetch to `useQuery(['campaigns', summary])` and watch the two
tabs share one request. The LRU cache is a building block: use it to cap the
query cache size or to memoise expensive derived data in later milestones.

## Interviewer follow-ups (talk-through, not implemented)

- Garbage collection: when should an entry with zero observers be dropped?
  Sketch a `gcTime` timer that starts on last unsubscribe and cancels on
  resubscribe.
- Paginated SWR: how do you keep the previous page's rows visible while the
  next page loads (`placeholderData: keepPrevious`) without breaking the
  stale-response guard?
- Retry with backoff on `NETWORK` errors — where does it live, the client or
  the hook, and how does it interact with `invalidateQueries`?
- Two tabs: how would you broadcast `setQueryData` writes across
  `BroadcastChannel` so an approval in one tab shows in the other?

## Say out loud

- Separate *cache entry* from *observer*: the entry owns `promise`, `data`,
  `status`; observers subscribe to it. That is what makes dedupe and SWR
  fall out for free.
- The stale-response guard is about identity: keep the in-flight promise on
  the entry and compare `entry.promise === thisPromise` when it settles; a
  component switching keys simply subscribes to a different entry.
- `useSyncExternalStore` needs a referentially stable snapshot — memoise the
  `QueryState` object per entry version or React will loop.
- Ask: "Is `approveCampaigns` all-or-nothing on the server? Then the
  optimistic flip is all-or-nothing too, and rollback restores the whole
  page, not row by row."
- First test to write: "two observers of the same key call `queryFn` once."
