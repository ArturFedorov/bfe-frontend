# 070. Stale-While-Revalidate Cache

**Difficulty:** Medium
**Topics:** Caching, Promises, Background Refresh

---

## Description

A settings panel reads feature-flag config on every open. Users should never
wait on a network round-trip once a value is known, but the value must also
never grow indefinitely stale. Build `staleWhileRevalidate(fetcher)` — a
wrapper around an async, key-based fetcher. The first call for a key awaits
the fetch and caches the result. Every later call returns the cached value
immediately **and** kicks off one background refresh for that key; concurrent
stale hits must share a single refresh, not stampede the backend. When a
refresh succeeds it replaces the cached value; when it fails, the old value
stays intact and the next call simply tries again.

## Examples

```ts
const getConfig = staleWhileRevalidate((key: string) => api.fetchConfig(key));

await getConfig('flags');   // cold: awaits the fetch, caches v1
await getConfig('flags');   // instant v1, refresh for v2 starts in background
await getConfig('flags');   // still v1 if the refresh hasn't landed; v2 after

// concurrent stale hits → one refresh
await Promise.all([getConfig('flags'), getConfig('flags')]); // 1 refresh total
```

## Constraints

- Cold cache: the call awaits the fetcher and resolves with its value;
  a cold-cache rejection propagates to the caller and nothing is cached
  (the next call fetches again). Concurrent cold calls share one fetch.
- Warm cache: the call resolves with the cached value without waiting for the
  refresh it triggers.
- At most one refresh per key is in flight at any instant — extra stale hits
  attach to the existing refresh rather than starting another.
- A failed refresh never corrupts or evicts the cached value, and must not
  surface as an unhandled rejection; a later call serves the stale value and
  triggers a new refresh attempt.
- Keys are fully independent (values, in-flight fetches, and failures).

## Target

Warm reads resolve with the cached value immediately, with at most one
in-flight refresh per key.

## Interviewer follow-up

This cache grows forever and refreshes on every read. What would you change to
add TTL-based staleness (only revalidate if older than t) and bounded memory —
and how does that interact with the in-flight refresh dedupe?
