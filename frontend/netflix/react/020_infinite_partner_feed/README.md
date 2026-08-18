# 020. Infinite Partner Feed

**Difficulty:** Medium
**Topics:** IntersectionObserver, Infinite Scroll, In-Flight Guards

---

## Scenario

The integration monitoring page shows a live feed of partner events (asset
received, validation failed, delivery confirmed…). There are far too many to
render at once, so the feed loads a page at a time as the user scrolls: a
sentinel element at the bottom is watched with an `IntersectionObserver`, and
when it comes into view the next page loads. The previous attempt loaded page
3 four times because the observer kept firing while a request was in flight.

## Acceptance Criteria

- Loads page 1 via the injected `fetchEvents(page)` prop on mount.
- Renders each event as an `<article>` inside a container with `role="feed"`;
  the feed has `aria-busy="true"` exactly while a page is loading.
- While loading, shows a `'Loading events…'` indicator with `role="status"`.
- Observes a sentinel element with `IntersectionObserver`; when it intersects,
  fetches the next page and appends (never replaces) the events.
- No duplicate page loads: observer firing while a request is in flight must
  NOT trigger another fetch — each page is requested exactly once.
- When a response has `hasMore: false`, shows `'No more events'`, stops
  observing (the observer is disconnected), and further intersections fetch
  nothing.
- A11y: `role="feed"` + `aria-busy`, events as articles, loading state
  announced via `role="status"`.

## Example

```tsx
<InfinitePartnerFeed fetchEvents={(page) => api.listEvents({ page })} />
// mount → fetchEvents(1)
// sentinel intersects → fetchEvents(2)
// { hasMore: false } → "No more events", observer disconnected
```

## Target

25–35 minutes. Senior signals: an in-flight ref guard (state is too slow for
this), observer lifecycle tied to `hasMore` with cleanup, and page number
tracked in a ref so the callback never sees a stale page.

## Interviewer follow-up

Why does a `loading` state variable alone fail to prevent duplicate loads when
the observer fires twice in the same tick, and why does a ref fix it? What
would change if `fetchEvents` could reject?
