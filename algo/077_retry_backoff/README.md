# 077. Retry with Exponential Backoff

**Difficulty:** Medium
**Topics:** Retry Logic, Exponential Backoff, Error Classification, Injectable Timers

---

## Description

A flaky upstream API needs a disciplined retry wrapper. Implement
`retry(fn, { retries, baseMs, maxMs, jitter, isRetryable })`: call `fn` (it receives the
0-based attempt number), and on failure retry up to `retries` more times. The delay before
retry `i` is `baseMs * 2^i`, capped at `maxMs`; with `jitter: true` the delay becomes
`floor(delay * random())` (full jitter). Errors are retried only if `isRetryable(error)`
returns true — a non-retryable error rejects immediately with no further attempts, and
exhausting all retries rejects with the last error. Both the sleep function and the RNG are
injectable so tests never depend on wall-clock time.
Repeat drill — you have solved this shape before; do it from a blank file without looking at your old solution.

## Examples

```ts
// 1 initial attempt + up to 3 retries, waiting 100ms, 200ms, 400ms between them
await retry((attempt) => fetchUsers(attempt), { retries: 3, baseMs: 100 });

// cap every delay at 250ms, only retry 5xx-style errors
await retry(() => callUpstream(), {
  retries: 5,
  baseMs: 100,
  maxMs: 250, // delays: 100, 200, 250, 250, 250
  isRetryable: (e) => e instanceof HttpError && e.status >= 500,
});

// deterministic jitter in tests
await retry(() => flaky(), { retries: 2, baseMs: 100, jitter: true, random: () => 0.5 });
// delays: 50, 100
```

## Constraints

- Total attempts = `1 + retries`; `retries: 0` means a single attempt.
- Delay before retry `i` (0-based) is `min(baseMs * 2^i, maxMs)`; `maxMs` defaults to no cap.
- `jitter: true` scales each capped delay by `random()` (default `Math.random`), floored to
  an integer.
- `isRetryable` defaults to "retry everything"; a non-retryable error rejects immediately
  and `fn` is not called again.
- On exhaustion, reject with the error from the final attempt.
- `sleep(ms)` is injectable; the default uses `setTimeout` so fake timers work.
- No sleep after the final failed attempt, and none on success.

## Target

Exact delay schedule min(baseMs * 2^i, maxMs) with optional full jitter, and not a single wasted attempt on non-retryable errors.

## Interviewer follow-up

Why does adding jitter matter in a real system — what goes wrong when thousands of clients all retry with the same deterministic backoff schedule?
