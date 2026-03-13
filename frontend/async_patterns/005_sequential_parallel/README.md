# 5. Sequential vs Parallel Execution

**Difficulty:** Easy
**Topics:** Promises, Promise.all, Sequential Execution, Concurrency

---

## Description

Implement two functions:

- `sequential` — runs an array of async task functions one after another, waiting for each to complete before starting the next.
- `parallel` — runs all async task functions concurrently and waits for all to complete.

Both functions return the results in the same order as the input tasks.

## Examples

```ts
const results = await sequential([
  () => fetchUser(1),
  () => fetchUser(2),
]);
// fetchUser(2) starts only after fetchUser(1) completes

const results = await parallel([
  () => fetchUser(1),
  () => fetchUser(2),
]);
// Both start immediately
```

## Constraints

- Tasks are functions returning promises (not raw promises)
- Results must be in input order
- If any task rejects, the returned promise should reject
- Empty task arrays should return an empty results array

## Approach Hints

<details>
<summary>Hint 1</summary>
For `sequential`, use a `for...of` loop with `await` inside, pushing each result to an array.
</details>

<details>
<summary>Hint 2</summary>
For `parallel`, invoke all task functions immediately and pass the resulting promises to `Promise.all`.
</details>

<details>
<summary>Hint 3</summary>
You can also implement `sequential` using `Array.reduce` with a promise chain, though a simple loop is more readable.
</details>
