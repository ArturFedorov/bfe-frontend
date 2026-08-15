# 069. Circuit Breaker

**Difficulty:** Medium
**Topics:** Resilience Patterns, State Machines, Injectable Clock

---

## Description

A recommendation service is flaking, and every timed-out call to it burns a
thread and 5 seconds of user patience. Build a `CircuitBreaker` that wraps
calls via `exec(fn)` and moves through three states. **Closed** (normal):
calls pass through; after `failureThreshold` *consecutive* failures the
circuit opens. **Open**: `exec` rejects immediately with `CircuitOpenError`
without invoking `fn`. After `cooldownMs` have elapsed, the next `exec` is a
**half-open probe**: `fn` is invoked once — success closes the circuit,
failure re-opens it for another full cooldown. The clock is injectable via
`options.now` so the breaker is testable without real waiting.

## Examples

```ts
const breaker = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 10_000 });

await breaker.exec(() => callService()); // closed: passes through

// after 3 consecutive failures…
await breaker.exec(() => callService()); // rejects with CircuitOpenError, fn NOT called

// 10s later: half-open — one probe goes through
await breaker.exec(() => callService()); // success → circuit closes again

// injectable clock for tests
let t = 0;
const testable = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 500, now: () => t });
```

## Constraints

- Only *consecutive* failures count: any success while closed resets the
  failure counter to zero.
- While open (and before the cooldown elapses), `exec` rejects with
  `CircuitOpenError` and must **not** invoke `fn`.
- The first call at or after `cooldownMs` since opening is the half-open
  probe: it invokes `fn`; a resolved probe fully closes the circuit (counter
  reset), a rejected probe re-opens it and restarts the cooldown.
- Underlying errors propagate unchanged to the caller — the breaker never
  swallows or wraps them (only open-circuit rejections use `CircuitOpenError`).
- Time comes from `options.now` when provided, defaulting to `Date.now`; the
  breaker never schedules its own timers.

## Target

Once open, no call reaches the failing service until one probe per cooldown
period is allowed through.

## Interviewer follow-up

Two hundred requests arrive in the same millisecond the circuit becomes
half-open. What should happen to the 199 that are not the probe, and how would
you implement that choice?
