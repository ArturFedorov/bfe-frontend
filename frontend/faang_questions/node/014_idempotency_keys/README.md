# 014. Idempotency Keys

**Difficulty:** Hard
**Topics:** REST, Idempotency, Retries, Injectable Clock

---

## Scenario

Partners submit billing reports through `POST /reports`. Their networks are
flaky, their clients retry — and a retried POST must never generate a second
report. The industry answer (Stripe-style) is an `Idempotency-Key` header:
the client picks a unique key per logical operation, and the server
guarantees at-most-once execution per key, replaying the original response to
retries. You are building that guarantee as a wrapper any handler can wear.

## Requirements

`withIdempotency(handler, options)` returns a `Handler`.
`options = { store?, clock?, ttlMs? }` — `store` is the injected
`Map<string, IdempotencyEntry>`, `clock` returns ms (default `Date.now`),
`ttlMs` defaults to 24h.

- The key is read from the `Idempotency-Key` header, **case-insensitively**
  (`idempotency-key`, `IDEMPOTENCY-KEY` all work).
- **No key present:** the handler runs normally every time; nothing is
  stored or replayed.
- **First request with a key:** run the handler, store
  `{ fingerprint, response, storedAt }` under the key, return the response
  unmodified.
- **Replay (same key, same payload):** the handler MUST NOT run again. The
  stored response is returned with an added header
  `'Idempotency-Replayed': 'true'` (other stored headers preserved).
- **Payload fingerprint:** a canonical JSON serialization of the body with
  object keys sorted recursively — `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` are
  the SAME payload.
- **Conflict (same key, different payload):** **422** with body
  `{ error: 'Idempotency-Key reused with a different payload' }`; the
  handler does not run.
- **Expiry:** an entry older than `ttlMs` (i.e. `now - storedAt >= ttlMs`,
  per the injected clock) is treated as absent: the handler runs again and
  the new response is stored fresh.
- **Failure policy:** responses with status **>= 500 are never stored** — a
  retry after a 5xx re-executes the handler so a transient failure is not
  replayed forever. 2xx–4xx responses ARE stored and replayed (a 400 is a
  deterministic answer to that payload).

## Example

```ts
const store = new Map<string, IdempotencyEntry>();
let t = 0;
const post = withIdempotency(createReport, { store, clock: () => t, ttlMs: 1000 });

const a = await post(reqWithKey('k1', { period: 'Q3' })); // handler runs → 201
const b = await post(reqWithKey('k1', { period: 'Q3' })); // replay, handler NOT run
// b = { ...a, headers: { ...a.headers, 'Idempotency-Replayed': 'true' } }

await post(reqWithKey('k1', { period: 'Q4' }));
// 422 { error: 'Idempotency-Key reused with a different payload' }
```

## Target

- At-most-once handler execution per (key, payload) within the TTL —
  provable via a call counter in tests.
- ~60 minutes.

## Interviewer follow-up

- Two identical requests arrive *concurrently* with the same key — what does
  this implementation do, and how would you close that race (in-flight
  promise map, or a DB unique constraint)?
- Why fingerprint the payload at all, instead of trusting the key alone?
- What belongs in the fingerprint besides the body — method? path? headers?
