# 11. Implement Promise.race

**Difficulty:** Easy

**Topics:** Promises, Async, Race Conditions

---

## Description

Implement your own version of `Promise.race`. The function takes an array of promises (or plain values) and returns a single promise that resolves or rejects as soon as the first promise settles.

```typescript
function promiseRace<T>(promises: (T | Promise<T>)[]): Promise<T>
```

---

## Examples

### Example 1
```typescript
await promiseRace([
  new Promise((resolve) => setTimeout(() => resolve("slow"), 100)),
  Promise.resolve("fast"),
]);
// => "fast"
```

### Example 2
```typescript
await promiseRace([
  Promise.reject("error"),
  Promise.resolve("ok"),
]);
// => rejects with "error"
```

---

## Constraints

- Returns a promise that settles with the first settled promise's value or reason
- Must handle non-promise values (treated as already resolved)
- If the array is empty, the returned promise stays pending forever (native behavior)

---

## Approach Hints

<details><summary>Hint 1</summary>
Return a new Promise. Inside it, iterate over all inputs and use `Promise.resolve()` to wrap each value.
</details>

<details><summary>Hint 2</summary>
For each wrapped promise, call `.then(resolve, reject)` on the outer promise. The first one to settle wins.
</details>

<details><summary>Hint 3</summary>
Since a promise can only be resolved/rejected once, subsequent calls to `resolve` or `reject` are simply ignored.
</details>
