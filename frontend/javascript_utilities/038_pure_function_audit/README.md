# 38. Pure Function Audit

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Functional Programming, Purity, Memoization

---

## Description

A function is **pure** when it is deterministic (same inputs, same output) and has no side effects (it does not mutate its arguments or anything else). Only pure functions are safe to memoize: a cache replays the first result forever, so a non-deterministic function would return stale values and a mutating function would skip its side effect on every cache hit.

Implement two helpers:

1. `isPureCall(fn, args, options)` runs `fn` several times with structurally cloned copies of `args` and reports what it observed.
2. `memoizePure(fn)` memoizes `fn` keyed by `JSON.stringify(args)`.

```typescript
interface PureCallReport {
  deterministic: boolean; // every run returned a deeply equal value
  mutatesArgs: boolean; // any run changed the arguments it was given
  results: unknown[]; // the return value of each run
}

function isPureCall<A extends unknown[]>(
  fn: (...args: A) => unknown,
  args: A,
  options?: { runs?: number },
): PureCallReport;

function memoizePure<T extends (...args: any[]) => any>(fn: T): T;
```

Rules:

- `runs` defaults to `3`; throw `RangeError` for `runs < 1`
- Each run receives its own `structuredClone(args)`, so runs do not leak into each other and the caller's `args` are never touched
- Compare results and arguments with deep equality, not `===`; implement a small `deepEqual` in the module
- `memoizePure` must cache `undefined` results too and forward `this`

---

## Examples

### Example 1

```typescript
isPureCall((a: number, b: number) => a + b, [1, 2]);
// { deterministic: true, mutatesArgs: false, results: [3, 3, 3] }
```

### Example 2

```typescript
isPureCall(() => Math.random(), []).deterministic; // false

isPureCall((list: number[]) => list.push(1), [[0]]).mutatesArgs; // true
```

### Example 3

```typescript
const slowSquare = jest.fn((n: number) => n * n);
const square = memoizePure(slowSquare);

square(4); // 16
square(4); // 16, slowSquare called once
```

---

## Constraints

- `args` must be structured-cloneable (no functions or DOM nodes)
- A function that returns a fresh but deeply equal object on each run is deterministic
- Do not import `deepEqual` from another task; write a minimal one here

---

## Approach Hints

<details><summary>Hint 1</summary>
For each run: `const copy = structuredClone(args); results.push(fn(...copy)); if (!deepEqual(copy, args)) mutated = true;`
</details>

<details><summary>Hint 2</summary>
`deterministic` is `results.every((r) => deepEqual(r, results[0]))`. A minimal `deepEqual` needs: `Object.is`, arrays by index, plain objects by own keys, and `Date` by time.
</details>

<details><summary>Hint 3</summary>
In `memoizePure`, use `cache.has(key)` rather than `cache.get(key) !== undefined` so a cached `undefined` is honored.
</details>

---

## Related Problems

- Implement Memoize
- Implement Deep Equal
