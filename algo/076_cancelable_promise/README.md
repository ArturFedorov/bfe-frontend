# 076. Cancelable Promise

**Difficulty:** Medium
**Topics:** Promises, AbortSignal, Cancellation, Cleanup

---

## Description

A search box fires a request per keystroke, and stale requests must be abandoned cleanly.
Implement `cancelable(promiseFactory, signal, cleanup?)`: it invokes the factory to start the
work and returns a promise that settles like the underlying one — unless `signal` aborts
first, in which case it rejects with an `AbortError`. If the signal is already aborted when
`cancelable` is called, it rejects immediately and the factory is never invoked. The optional
`cleanup` callback runs exactly once whenever the returned promise settles — resolve, reject,
or abort — and late settlements of the underlying promise after an abort are ignored.
Repeat drill — you have solved this shape before; do it from a blank file without looking at your old solution.

## Examples

```ts
const controller = new AbortController();

const result = cancelable(
  () => fetchResults('hello'),
  controller.signal,
  () => spinner.hide()
);

controller.abort();
await result; // rejects with AbortError; spinner.hide() ran exactly once

// already-aborted signal: factory never runs
const dead = new AbortController();
dead.abort();
await cancelable(() => fetchResults('x'), dead.signal); // rejects immediately with AbortError
```

## Constraints

- Abort rejects the returned promise with an `AbortError` (exported class, `name === 'AbortError'`).
- An already-aborted signal rejects immediately without ever invoking the factory
  (`cleanup` still runs once).
- `cleanup` runs exactly once on the first settlement — value, error, or abort — and never twice.
- After the returned promise settles, a later abort is a no-op, and after an abort, a later
  settlement of the underlying promise is ignored.
- Remove the abort listener once settled — no leaked listeners on long-lived signals.
- `cleanup` is optional; everything works without it.

## Target

First settlement wins (value, error, or AbortError), and cleanup runs exactly once no matter which.

## Interviewer follow-up

The underlying request keeps running after abort — how would you extend the contract so the factory itself can stop work early (hint: what would you pass into it)?
