# 12. Implement Promise.allSettled

**Difficulty:** Medium

**Topics:** Promises, Async, Error Handling

---

## Description

Implement your own version of `Promise.allSettled`. The function takes an array of promises (or plain values) and returns a promise that resolves after all of the given promises have either fulfilled or rejected, with an array of objects describing the outcome of each promise.

Each result object has:
- `{ status: "fulfilled", value: T }` for resolved promises
- `{ status: "rejected", reason: any }` for rejected promises

```typescript
function promiseAllSettled<T>(promises: (T | Promise<T>)[]): Promise<Array<{ status: "fulfilled"; value: T } | { status: "rejected"; reason: any }>>
```

---

## Examples

### Example 1
```typescript
await promiseAllSettled([Promise.resolve(1), Promise.reject("err"), Promise.resolve(3)]);
// => [
//   { status: "fulfilled", value: 1 },
//   { status: "rejected", reason: "err" },
//   { status: "fulfilled", value: 3 },
// ]
```

---

## Constraints

- Must wait for all promises to settle (never short-circuits)
- Must preserve the order of results matching the input order
- Must handle non-promise values (treat them as fulfilled)
- Empty array should resolve immediately with `[]`

---

## Approach Hints

<details><summary>Hint 1</summary>
Similar to `Promise.all`, but instead of rejecting on the first failure, record both successes and failures.
</details>

<details><summary>Hint 2</summary>
For each promise, use `.then()` to record a fulfilled result and `.catch()` to record a rejected result, placing each at the correct index.
</details>

<details><summary>Hint 3</summary>
Use a counter to track how many promises have settled. When all have settled, resolve the outer promise with the results array.
</details>
