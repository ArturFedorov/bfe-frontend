# 079. Token Bucket Rate Limiter

**Difficulty:** Medium
**Topics:** Rate Limiting, Injectable Clock, Async Coordination

---

## Description

An API client must respect an upstream rate limit. Implement a `TokenBucket` with a maximum
`capacity` and a continuous `refillPerSecond` rate. The bucket starts full; tokens refill
lazily based on elapsed time from an injectable clock `{ now: () => number }` (milliseconds),
accumulate fractionally, and never exceed `capacity`. `tryAcquire(n)` synchronously takes `n`
tokens (default 1) and returns whether it succeeded; `acquire(n)` returns a promise that
resolves once the tokens have been taken, waiting for refill if needed and serving waiters in
FIFO order.
Repeat drill — you have solved this shape before; do it from a blank file without looking at your old solution.

## Examples

```ts
const bucket = new TokenBucket({ capacity: 3, refillPerSecond: 1 });

bucket.tryAcquire();  // true
bucket.tryAcquire(2); // true — bucket now empty
bucket.tryAcquire();  // false

await bucket.acquire(); // resolves ~1s later, once a token has refilled

// deterministic tests with an injectable clock
let t = 0;
const testBucket = new TokenBucket({ capacity: 2, refillPerSecond: 2, clock: { now: () => t } });
testBucket.tryAcquire(2); // true
t += 500;                 // 0.5s -> 1 token refilled
testBucket.tryAcquire();  // true
```

## Constraints

- The bucket starts at full `capacity`; refill is computed lazily from clock deltas
  (`elapsedMs / 1000 * refillPerSecond`), accumulates fractionally, and is capped at
  `capacity`.
- `tryAcquire(n)` is synchronous: all-or-nothing, no partial takes, no waiting.
- `acquire(n)` resolves as soon as `n` tokens are available and taken; multiple waiters are
  served strictly FIFO — a later small request must not starve an earlier large one.
- Requesting `n > capacity` throws a `RangeError` (it could never succeed); `n` defaults
  to 1.
- The clock is injectable and defaults to `Date.now`; internal waiting must be fake-timer
  friendly (`setTimeout`, no busy-wait).

## Target

Lazy fractional refill capped at capacity, sync all-or-nothing tryAcquire, and FIFO-fair awaitable acquire.

## Interviewer follow-up

How does a token bucket differ from a fixed-window counter at the burst boundary — which one lets 2x the limit through around a window edge, and why?
