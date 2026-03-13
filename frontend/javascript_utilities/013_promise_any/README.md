# 13. Implement Promise.any

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Promises, Async

---

## Description

Implement a `promiseAny` function that takes an array of promises (or values) and returns a single promise that resolves as soon as any of the input promises resolves. If all promises reject, it rejects with an `AggregateError` containing all rejection reasons.

```typescript
function promiseAny<T>(promises: (T | Promise<T>)[]): Promise<T>
```

---

## Examples

### Example 1
```typescript
const result = await promiseAny([
  Promise.reject("fail"),
  Promise.resolve("success"),
  Promise.resolve("also success"),
]);
// result === "success"
```

### Example 2
```typescript
await promiseAny([
  Promise.reject("a"),
  Promise.reject("b"),
]);
// throws AggregateError with errors ["a", "b"]
```

---

## Constraints

- If the array is empty, reject with an `AggregateError`
- Non-promise values should be treated as resolved promises
- The order of errors in `AggregateError` should match the input order

---

## Approach Hints

<details><summary>Hint 1</summary>
This is the inverse of `Promise.all` — you want the first success instead of waiting for all.
</details>

<details><summary>Hint 2</summary>
Track rejection count and collect errors in order.
</details>

<details><summary>Hint 3</summary>
Resolve the outer promise on the first fulfillment; reject only when all have rejected.
</details>

---

## Related Problems

- Implement Promise.all
- Implement Promise.race
- Implement Promise.allSettled
