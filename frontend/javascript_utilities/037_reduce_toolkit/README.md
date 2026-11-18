# 37. Reduce Toolkit

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Functional Programming, Array.prototype.reduce

---

## Description

`reduce` is the one array method that can express every other one. Prove it: implement `map`, `filter`, `flatMap`, `countBy` and `keyBy` where each function's body is a **single** `Array.prototype.reduce` call. No loops, no `.map`, `.filter` or `.flatMap`, no recursion.

```typescript
function map<T, U>(arr: T[], fn: (item: T, index: number, arr: T[]) => U): U[];

function filter<T>(
  arr: T[],
  predicate: (item: T, index: number, arr: T[]) => boolean,
): T[];

function flatMap<T, U>(
  arr: T[],
  fn: (item: T, index: number, arr: T[]) => U | U[],
): U[];

function countBy<T>(
  arr: T[],
  keyFn: (item: T) => PropertyKey,
): Record<string, number>;

function keyBy<T>(arr: T[], keyFn: (item: T) => PropertyKey): Record<string, T>;
```

A test reads the module source and fails if it finds `.map(`, `.filter(`, `.flatMap(`, `for (`, `for(` or `while`, or if it does not find `.reduce(`.

---

## Examples

### Example 1

```typescript
map([1, 2, 3], (n) => n * 2); // [2, 4, 6]
filter([1, 2, 3, 4], (n) => n % 2 === 0); // [2, 4]
```

### Example 2

```typescript
flatMap([1, 2], (n) => [n, n * 10]); // [1, 10, 2, 20]
flatMap(['a b', 'c'], (s) => s.split(' ')); // ['a', 'b', 'c']
flatMap([1, 2], (n) => [[n]]); // [[1], [2]]  (only one level)
```

### Example 3

```typescript
countBy(['apple', 'avocado', 'banana'], (s) => s[0]); // { a: 2, b: 1 }
keyBy(
  [
    { id: 'x', v: 1 },
    { id: 'y', v: 2 },
  ],
  (o) => o.id,
);
// { x: { id: 'x', v: 1 }, y: { id: 'y', v: 2 } }
```

---

## Constraints

- One `reduce` call per function; no other iteration construct
- `map` must keep array results nested and keep `undefined` results
- `flatMap` flattens exactly one level
- `keyBy` keeps the **last** item for a duplicate key
- Never mutate the input array

---

## Approach Hints

<details><summary>Hint 1</summary>
Start every function with `arr.reduce((acc, item, index) => { ...; return acc; }, initial)`. Pushing into `acc` is fine; spreading `[...acc, x]` on every step is O(n^2).
</details>

<details><summary>Hint 2</summary>
For `map`, use `acc.push(fn(item, index, arr))`, never `acc.concat(...)`: `concat` would flatten an array result.
</details>

<details><summary>Hint 3</summary>
For `flatMap`, `acc.concat(result)` is exactly one level of flattening whether `result` is an array or a single value. Or check `Array.isArray(result)` and `push(...result)`.
</details>

---

## Related Problems

- Implement Array.prototype.reduce
- Implement GroupBy
