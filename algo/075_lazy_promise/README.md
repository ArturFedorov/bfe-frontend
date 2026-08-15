# 075. Lazy Promise

**Difficulty:** Easy
**Topics:** Promises, Thenables, Lazy Evaluation

---

## Description

A regular `Promise` runs its executor the moment it is constructed — even if nobody ever
consumes the result. Build a `LazyPromise<T>` that stores the executor at construction time
but does not run it. The executor runs only when the first consumer shows up via `.then`,
`.catch`, or `await` (which calls `.then` under the hood), and it runs exactly once no
matter how many consumers attach before or after it settles. Every consumer observes the
same settled value or rejection reason, and `then`/`catch` return real chainable promises.
Repeat drill — you have solved this shape before; do it from a blank file without looking at your old solution.

## Examples

```ts
const lazy = new LazyPromise<number>((resolve) => {
  console.log('working...');
  resolve(42);
});
// nothing logged yet — executor has not run

const doubled = await lazy.then((v) => v * 2); // logs 'working...', doubled === 84
const again = await lazy;                      // no second log — executor ran once

const failing = new LazyPromise<never>((_, reject) => reject(new Error('nope')));
await failing.catch((e) => console.error(e)); // executor starts on .catch too
```

## Constraints

- The executor must not run during construction — only on the first `.then`, `.catch`,
  or `await`.
- The executor runs exactly once, even when multiple consumers attach concurrently.
- All consumers see the same resolution value / rejection reason.
- `then` and `catch` return native `Promise` instances so chaining works as usual.
- `LazyPromise` must be awaitable (implements `PromiseLike<T>`).

## Target

Zero work until first consumption; exactly one executor run regardless of consumer count.

## Interviewer follow-up

If the executor throws synchronously when it finally runs, what should each consumer observe — and how does native `new Promise` handle that same case?
