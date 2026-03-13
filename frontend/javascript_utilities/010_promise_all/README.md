# 10. Implement Promise.all

**Difficulty:** Medium

**Topics:** Promises, Async, Error Handling

---

## Description

Implement your own version of `Promise.all`. The function takes an array of promises (or plain values) and returns a single promise that:
1. Resolves with an array of all resolved values (in the same order) when all input promises resolve
2. Rejects with the reason of the first promise that rejects

```typescript
function promiseAll<T>(promises: (T | Promise<T>)[]): Promise<T[]>
```

---

## Examples

### Example 1
```typescript
await promiseAll([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]);
// => [1, 2, 3]
```

### Example 2
```typescript
await promiseAll([Promise.resolve(1), Promise.reject("error"), Promise.resolve(3)]);
// => rejects with "error"
```

---

## Constraints

- Must preserve the order of results matching the input order
- Must handle non-promise values (treat them as resolved)
- Must reject with the first rejection reason
- Empty array should resolve immediately with `[]`

---

## Approach Hints

<details><summary>Hint 1</summary>
Return a new Promise. Inside it, iterate over all inputs and use `Promise.resolve()` to wrap each value.
</details>

<details><summary>Hint 2</summary>
Track the number of resolved promises with a counter. When the counter equals the input length, resolve the outer promise.
</details>

<details><summary>Hint 3</summary>
Use the index from iteration to place each result in the correct position in the output array to preserve order.
</details>
