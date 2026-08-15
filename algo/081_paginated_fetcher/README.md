# 081. Paginated Fetcher with Prefetch

**Difficulty:** Medium
**Topics:** Async Generators, Pagination, Prefetching, Lazy Iteration

---

## Description

An activity feed is served by a cursor API: `fetchPage(cursor)` resolves to
`{ items, nextCursor }`, where a `null` cursor requests the first page and a `null`
`nextCursor` marks the last one. Implement `paginate(fetchPage)` as an async generator that
yields items one by one across page boundaries, starting no work until the consumer asks for
the first item. To hide latency, as soon as a page arrives it starts fetching the next page
in the background while the consumer is still processing the current items. Once the consumer
stops (break, `return()`, or `take`), no further fetches are issued beyond the one already in
flight. Also implement `take(source, n)`, which collects the first `n` items and closes the
iterator — even mid-page.
Repeat drill — you have solved this shape before; do it from a blank file without looking at your old solution.

## Examples

```ts
const feed = paginate((cursor) => api.fetchActivity(cursor));

for await (const event of feed) {
  render(event); // while page 1 renders, page 2 is already being fetched
  if (event.type === 'stop') break; // no further pages are requested
}

const firstTen = await take(paginate(fetchPage), 10); // stops mid-page if needed
```

## Constraints

- Lazy start: `fetchPage` is not called until the consumer requests the first item.
- Items are yielded in order — all of page `i` before any of page `i + 1`.
- Prefetch: the fetch for page `i + 1` starts as soon as page `i` resolves (given a non-null
  `nextCursor`), not when its first item is requested.
- Iteration ends when a page reports `nextCursor: null` and its items are drained; empty
  `items` on the last page is valid.
- After the consumer stops, no new fetch beyond the in-flight prefetch is ever issued.
- A `fetchPage` rejection surfaces at the consumer's `await`; `take(source, 0)` resolves `[]`
  without pulling a single item, and `take` returns fewer than `n` items if the stream ends
  early.

## Target

Page i+1 is always in flight while page i is being consumed, yet not one page is fetched that the consumer never needed beyond it.

## Interviewer follow-up

Your prefetch keeps one page in flight — when would prefetching k pages ahead hurt more than help, and what backpressure signal would you use to decide?
