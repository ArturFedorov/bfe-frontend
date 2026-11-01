# 002. Event Loop Ordering

**Difficulty:** Easy
**Topics:** Event Loop, Microtasks, process.nextTick, Timers vs Check Phase

---

## Scenario

A delivery-status webhook handler started emitting log lines out of order after
someone "optimized" it with a mix of `process.nextTick`, promises, and
`setImmediate`. Before touching that code, prove you can predict Node's
scheduling. Build a small harness that schedules one callback of each kind,
records the order they actually fire in, and returns it — then write down
**why** that order is guaranteed.

## Requirements

- `observeEventLoopOrder()` returns a promise of the observed firing order as
  labels: `'sync'`, `'nextTick'`, `'promise'`, `'setImmediate'`,
  `'setTimeout'`.
- The scheduling must happen **inside a timer callback** so the
  `setImmediate`-vs-`setTimeout` ordering is deterministic (from the main
  script it is a coin flip — explain why in the blanks below).
- `observeMicrotaskInterleaving()` demonstrates queue-draining rules: a
  `nextTick` callback (`'tickA'`) schedules another `nextTick` (`'tickB'`) and
  a promise (`'promiseB'`); a promise (`'promiseA'`) is scheduled up front.
  Return the observed order. This too must schedule from a clean macrotask —
  called from inside an async function, the still-draining promise queue
  would let `promiseA` jump ahead of the nextTick queue.
- No wall-clock sleeps; each harness completes in a handful of loop turns.
- Both functions must be re-runnable (fresh state per call).

## Example

```ts
await observeEventLoopOrder();
// → ['sync', 'nextTick', 'promise', 'setImmediate', 'setTimeout']

await observeMicrotaskInterleaving();
// → ['tickA', 'tickB', 'promiseA', 'promiseB']
```

## Explain why (fill these in — the interviewer will ask)

1. `nextTick` fires before the promise callback because: ________________
2. Scheduled from inside a timer callback, `setImmediate` **always** beats a
   fresh `setTimeout(0)` because: ________________
3. From the top-level main script, `setTimeout(0)` vs `setImmediate` is
   non-deterministic because: ________________
4. In `observeMicrotaskInterleaving`, `tickB` runs before `promiseA` even
   though `promiseA` was scheduled first, because: ________________

## Target

15–20 minutes. The senior signals: knowing the nextTick queue drains fully
before the promise microtask queue, and knowing why the timers-vs-check race
exists (timer clamping vs loop phase position).

## Interviewer follow-up

A teammate uses `process.nextTick` recursively to "yield" between chunks of a
big loop, and now I/O callbacks starve. Why does that starve I/O when
`setImmediate` would not, and what would you replace it with?
