# 067. In-Flight Request Dedupe

**Difficulty:** Medium
**Topics:** Promises, Caching, Request Coalescing

---

## Description

Five components on a dashboard all call `loadUser('u42')` during the same
render pass, and the backend sees five identical requests. Build
`dedupe(fn)` — a wrapper around an async, key-based fetcher — so that
concurrent calls with the same key share a single in-flight promise and the
underlying function runs only once. The moment that promise settles (resolve
or reject), the entry is cleared: the next call with that key triggers a fresh
fetch. This is request coalescing, not caching — settled results are never
served again.

## Examples

```ts
const load = dedupe((key: string) => api.fetchUser(key));

// Both calls started while the first is in flight → one network request
const [a, b] = await Promise.all([load('u42'), load('u42')]);
// a === b, api.fetchUser called exactly once

await load('u42'); // in flight already settled → fresh fetch, called again

// Different keys never share
await Promise.all([load('u1'), load('u2')]); // two fetches
```

## Constraints

- Concurrent calls with the same key share one invocation of `fn`; all callers
  resolve with the same value.
- If the shared fetch rejects, every concurrent caller rejects with that same
  reason — a rejection is shared exactly like a success.
- The in-flight entry is removed when the promise settles (fulfilled or
  rejected), so the next call for that key re-invokes `fn` — a failed fetch
  must not be cached forever.
- Calls with different keys are fully independent, including their failures.
- The wrapper holds no entry for a key that has no fetch in flight (no
  unbounded memory growth).

## Target

For any key, at most one invocation of `fn` is in flight at any instant.

## Interviewer follow-up

A caller kicks off `load('u42')` and then the user navigates away — a second
caller arrives and shares the same promise. What are the risks of sharing
rejections (or `AbortController`-based cancellation) between unrelated callers,
and how would you handle per-caller cancellation on a shared fetch?
