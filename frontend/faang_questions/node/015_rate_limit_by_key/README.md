# 015. Rate Limit By Key

**Difficulty:** Medium
**Topics:** REST, Token Bucket, Rate Limiting, Injectable Clock

---

## Scenario

One partner's runaway cron job must not starve everyone else's API access.
You are wrapping the partner API in per-API-key rate limiting: each key gets
its own token bucket, and when a bucket runs dry the partner receives a 429
that tells them exactly how long to back off. This reuses your algo-track
token bucket — now with production HTTP semantics around it.

## Requirements

`withRateLimit(handler, options)` returns a `Handler`.
`options = { capacity, refillPerSecond, clock, keyHeader?, store? }` —
`clock` returns ms; `keyHeader` defaults to `'x-api-key'` (matched
case-insensitively); `store` is the injected `Map<string, Bucket>` keyed by
API key.

- **Token bucket per key:** a key's bucket is created *full* (`capacity`
  tokens) the first time the key is seen. Each allowed request consumes
  exactly 1 token.
- **Continuous refill:** on every request, the bucket first refills by
  `elapsedMs * refillPerSecond / 1000` tokens (fractions accumulate), capped
  at `capacity`.
- **Allowed** (≥ 1 token after refill): consume 1, invoke the handler, and
  return its response with an added header
  `'X-RateLimit-Remaining': String(Math.floor(tokensLeft))` (existing
  response headers preserved).
- **Limited** (< 1 token): **429** with headers
  `{ 'Retry-After': String(Math.ceil(secondsUntilOneToken)) }` (whole
  seconds, rounded up) and body `{ error: 'Rate limit exceeded' }`. The
  handler is not called and no token is consumed.
- **Unknown-key policy (documented choice):** a request without the key
  header is *unauthenticated*, not rate-limit-exempt — respond **401**
  `{ error: 'Missing API key' }` without touching any bucket or the handler.
  Rationale: falling through to a shared "anonymous" bucket would let one
  keyless client exhaust it for all misconfigured partners at once, and
  exempting keyless traffic would make removing the header a bypass.
- Buckets are fully independent across keys.

## Example

```ts
let t = 0;
const limited = withRateLimit(handler, {
  capacity: 3, refillPerSecond: 1, clock: () => t,
});

// t=0: three requests pass (Remaining 2, 1, 0) …
await limited(reqWithKey('acme'));
// … the fourth is refused:
await limited(reqWithKey('acme'));
// { status: 429, headers: { 'Retry-After': '1' }, body: { error: 'Rate limit exceeded' } }

t = 1000; // one token refilled
await limited(reqWithKey('acme')); // 200 again
```

## Target

- O(1) state per key; no timers — refill is computed lazily from the clock.
- ~45 minutes.

## Interviewer follow-up

- Why token bucket over fixed windows here — what burst behaviour do
  partners actually observe with each?
- Where does this state live when the API runs on 20 instances?
- Should 429s themselves consume tokens or extend the penalty? What abuse
  pattern motivates each choice?
