# 006. Race-Free Search

**Difficulty:** Medium
**Topics:** useEffect, Race Conditions, Cleanup, Fetch

---

## Scenario

The partner directory search fires a request every time the query changes, and
QA found the classic race: type "al", pause, then finish typing "alpha" — if
the slow "al" response arrives after the fast "alpha" one, the results panel
flips back to the stale "al" matches. On flaky VPN connections ops hit this
daily and stopped trusting the tool. Build the results panel so that a response
is only applied if it belongs to the latest query — out-of-order resolutions
must never win.

## Acceptance Criteria

- When `query` is empty or whitespace, renders `Type to search partners.` and
  performs no fetch.
- For a non-empty query, fetches `<endpoint>?q=<encoded query>` (default
  endpoint `/api/search`) and refetches whenever `query` changes.
- While pending, shows `Searching…` in an element with `role="status"`.
- Success renders a `role="list"` named `Search results` with one
  `role="listitem"` per result title; zero results renders
  `No matches for "<query>".`.
- Non-OK responses and rejections render `role="alert"` with an error message.
- Race safety: if an older request resolves after a newer one, the older
  response is discarded — the panel always shows results for the latest query.
- Effect cleanup also discards in-flight responses on unmount.

## Example

```ts
<ResultsPanel query={debouncedQuery} />
<ResultsPanel query="alpha" endpoint="/api/partner-search" />

// SearchResult shape:
// { id: 'p7', title: 'Alphaline Media' }
```

## Target

The rendered results always correspond to the current query prop — a stale response can never overwrite a fresher one.

## Interviewer follow-up

The ignore-flag fix discards stale responses but the stale requests still run
to completion. How would you cancel the network work itself, and when is that
worth doing?
