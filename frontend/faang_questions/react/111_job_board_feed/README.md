# 111. Job Board Feed

**Difficulty:** Medium
**Estimated time:** 35–45 min
**Topics:** two-step API (ids → items), concurrency pool (not batches), order-stable rendering, per-item failure + retry, paging with a per-id cache, unmount safety (alive ref / `AbortController`), `role="feed"`

---

## Scenario

The careers page pulls listings from a Hacker-News-style API: one call returns
**every** job id newest first, then each job is a separate request. The first
version fetched all 300 items on mount (the API rate-limited it), rendered
them in the order the responses *arrived* (the list reshuffled while loading),
and one 500 blanked the whole page. Users also hit "Load more" and watched the
first page refetch.

Build `<JobFeed>`: fetch ids once, load a page of items through a pool with a
bounded number of requests in flight, render in id order with a per-item
retry, page with `Load more`, and make unmount stop the pool.

## Contract

```ts
interface Job { id: number; title: string; by: string; time: number /* unix s */; url?: string }
interface JobApi {
  listIds(): Promise<number[]>;     // all ids, newest first
  getItem(id: number): Promise<Job>;
}

<JobFeed api={api} pageSize={6} concurrency={3} now={() => Date.now()} />
// pageSize default 6 · concurrency default 3 · now default Date.now

// pure (exported, unit-tested)
runPool<T>(tasks: Array<() => Promise<T>>, limit: number, options?: {
  signal?: AbortSignal;                                            // aborted → start nothing more
  onSettled?: (index: number, result: PromiseSettledResult<T>) => void;
}): Promise<PromiseSettledResult<T>[]>                             // results in TASK order
formatRelativeTime(timeSec: number, nowMs: number): string
// 'just now' (< 60 s) · 'N minute(s) ago' · 'N hour(s) ago' · 'N day(s) ago'; future → 'just now'
```

`runPool` is the reusable piece: the component calls it per page with one
task per id not yet cached. You may inline the pool instead — the tests only
import `runPool` for its own unit tests, and observe the component's
behaviour through `getItem` call counts.

### DOM shape (the tests query exactly this)

- `role="status"`: `Loading…` while `listIds` or a page is in flight,
  otherwise `Showing N of M jobs` (`N` = ids requested so far, `M` = all ids).
- `<div role="feed" aria-label="Jobs" aria-busy="true|false">` containing, in
  **id-list order**:
  - `<article aria-label={title}>` per loaded job — the title is an `<a href>`
    when `url` exists, plain text otherwise; `by`, and a `<time>` with the
    relative time computed from `now()`;
  - `<div role="alert">Failed to load job <id> <button>Retry</button></div>`
    for a failed item;
  - nothing (or a skeleton — your call) for an item still loading.
- `Load more` button: `disabled` while a page is in flight; **absent** once
  every id is shown (and when the id list is empty).
- A rejected `listIds` renders `role="alert"` with the error message and the
  status leaves `Loading…`.

## Requirements

1. **Ids once.** On mount call `api.listIds()` exactly once. Keep the full id
   list in state; derive `total` from it.
2. **Pool, not batches.** Load a page's items with at most `concurrency`
   `getItem` calls in flight: when any one settles, the next id starts
   immediately. `Promise.all` over chunks of 3 is *not* acceptable — the
   fourth call must start the moment the first one settles, not when all
   three have.
3. **Order by id list.** Render by iterating the shown ids and looking each
   up in an items map; never append in resolution order.
4. **Per-item failure.** A rejected `getItem` renders an alert row for that
   id; the pool continues with the other ids. `Retry` calls `getItem(id)`
   once more for that id only and replaces the row on success.
5. **Paging + cache.** `Load more` appends the next `pageSize` ids and runs
   the pool for the ones not already cached. Already-shown ids are never
   fetched twice; `listIds` is never called again.
6. **Status.** `Loading…` while any page (or the id list) is in flight,
   `Showing N of M jobs` otherwise; `aria-busy` on the feed mirrors it.
7. **Unmount safety.** After unmount, late settlements cause **no** state
   updates (alive ref or `AbortController`), and the pool starts **no**
   further `getItem` calls.

## Acceptance Criteria

- [ ] `runPool` returns results in task order when tasks settle out of order;
      rejections become `{ status: 'rejected' }` entries.
- [ ] `runPool` with `limit 2` over 5 tasks starts `[0, 1]`, then `2` when
      `1` settles, then `3` when `0` settles.
- [ ] `runPool` aborted via `signal` starts nothing more; in-flight tasks
      still settle; unstarted entries are rejected.
- [ ] `runPool([], n)` → `[]`.
- [ ] `formatRelativeTime` buckets: 30 s → `just now`, 60 s → `1 minute ago`,
      5 min, `1 hour ago`, `3 hours ago`, `2 days ago`; future → `just now`.
- [ ] Mount: `listIds` once; `Loading…`; `aria-busy="true"`; after 6 items
      settle: `Showing 6 of 14 jobs`, `aria-busy="false"`.
- [ ] Article: `aria-label` = title; link with `href` when `url`; no link
      without; shows `by` and `1 hour ago` for a one-hour-old job.
- [ ] Senior: after `listIds` resolves exactly 3 `getItem` calls are in
      flight (`[100, 99, 98]`); resolving `100` starts `97`; resolving `98`
      starts `96`; the max in flight over the page is 3.
- [ ] `concurrency 1`, `pageSize 2` → strictly sequential, `Showing 2 of 14 jobs`.
- [ ] Senior: resolving `98`, `99`, …, `100` last renders
      `[100, 99, 98, 97, 96, 95]`.
- [ ] `Load more`: `Loading…`, button disabled, calls `[94, 93, 92]` first; after
      settling `Showing 12 of 14 jobs`, 12 articles, no id fetched twice,
      `listIds` still once.
- [ ] Third page fetches `[88, 87]`; `Showing 14 of 14 jobs`; `Load more` gone.
- [ ] Empty id list → `Showing 0 of 0 jobs`, no `Load more`.
- [ ] Rejected item → `role="alert"` `Failed to load job 99` with `Retry`; the
      pool moved on (`97` was started); other 5 articles render.
- [ ] `Retry` → exactly one new `getItem(99)`; alert gone; the article lands in
      position 2.
- [ ] `Retry` failing again shows the alert again.
- [ ] Rejected `listIds` → alert with the message, no `getItem` calls.
- [ ] Senior: unmount with 3 in flight → settling them starts no 4th call and
      logs no React error.
- [ ] `listIds` settling after unmount starts no `getItem`.

## Baseline a11y

- `role="feed"` named `Jobs`, `aria-busy` while loading; each job is an
  `<article>` with an accessible name (the title).
- One polite `role="status"` for progress; per-item failures in `role="alert"`
  next to their `Retry` button so the fix is adjacent to the announcement.
- The title link is the only interactive element inside an article; the
  relative time is a `<time dateTime>` so AT can expose the absolute value.

## Constraints

- React only; no data-fetching library.
- Concurrency is a pool (worker loop over a shared index), not chunked
  `Promise.all`.
- Keep the per-id cache in a ref or in the items map — not refetching is
  observable through `getItem` call counts.
- Inject `now` for the relative time; do not read `Date.now()` directly in
  the render path.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- The API adds `getItems(ids: number[])` returning up to 20 at once. How do
  you fold it into the pool without losing per-item failure handling?
- Ids arrive newest first, but a **new** job can be posted while the user is
  reading. How would you surface "3 new jobs" without reshuffling the list?
- Replace `Load more` with infinite scroll: what from task 020 carries over,
  and what new hazard does the pool introduce (hint: two pages in flight)?

## Say out loud

- State shape first: `ids: number[] | null`, `shown: number`,
  `items: Map<id, loading | loaded | failed>`, `pageLoading`, plus two refs:
  `alive` and the per-id cache.
- Name the hazard: order and arrival are different axes — render by
  iterating `ids.slice(0, shown)`, never by pushing onto an array.
- Name the pool mechanic: N workers share one `next` index; each loops
  `while (next < tasks.length)`; the abort check sits at the top of the loop.
- Ask one API question: does `listIds` return *all* ids or only the latest N,
  and can an id disappear between `listIds` and `getItem` (404)?
- Name the first test you would write: "after `listIds` resolves there are
  exactly three `getItem` calls, and resolving one of them starts a fourth".
