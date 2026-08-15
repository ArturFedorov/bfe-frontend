# 066. Timeout Wrapper

**Difficulty:** Easy
**Topics:** Promises, Timers, Error Handling

---

## Description

Your service calls an upstream API that occasionally hangs forever, and a hung
call ties up the request handler indefinitely. Build `withTimeout(promise, ms)`:
it returns a promise that settles exactly like the original if it settles within
`ms` milliseconds, and otherwise rejects with a `TimeoutError`. The internal
timer must be cleared as soon as either outcome is decided — a service handling
thousands of requests per second cannot afford dangling timer handles keeping
the event loop busy (or a serverless process alive).

## Examples

```ts
// Resolves normally when the work finishes in time
const user = await withTimeout(fetchUser('u1'), 5000);

// Rejects with TimeoutError after 100ms of silence
await withTimeout(new Promise(() => {}), 100); // throws TimeoutError

// Original rejection wins if it happens first
await withTimeout(Promise.reject(new Error('boom')), 1000); // throws Error('boom')
```

## Constraints

- If the promise resolves before `ms`, resolve with its value; if it rejects
  before `ms`, reject with its original reason — never wrap or replace it.
- After `ms` milliseconds without settlement, reject with a `TimeoutError`.
- The timer must be cleared on either outcome — tests cannot observe your
  `setTimeout` handle directly, so they assert `jest.getTimerCount() === 0`
  after settlement.
- The wrapper must not mutate or cancel the original promise; a late settlement
  of the original after a timeout is simply ignored (and must not crash).
- Each call to `withTimeout` is independent — no shared state between wraps.

## Target

The returned promise settles with whichever outcome happens first, and zero
live timers remain after it settles.

## Interviewer follow-up

Your timeout rejects the promise, but if the underlying work is an HTTP fetch
the request is still on the wire — how would you extend the API with
`AbortController` so the network call is actually cancelled too?
