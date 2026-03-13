# 1. Concurrency Limiter

**Difficulty:** Medium
**Topics:** Promises, Concurrency, Async Control Flow

---

## Description

Implement an `asyncPool` function that executes an array of async task functions with a concurrency limit. At most `limit` tasks should be running at the same time. Results must be returned in the same order as the input tasks, regardless of completion order.

## Examples

```ts
const results = await asyncPool(2, [
  () => fetchUser(1),
  () => fetchUser(2),
  () => fetchUser(3),
]);
// At most 2 fetches run concurrently
// results = [user1, user2, user3] in order
```

## Constraints

- `limit` is a positive integer
- `tasks` is an array of functions that return promises
- If any task rejects, the returned promise should reject
- Results must preserve input order

## Approach Hints

<details>
<summary>Hint 1</summary>
Track currently executing promises in a Set or array. When the set reaches the limit, use `Promise.race` to wait for one to finish before starting the next.
</details>

<details>
<summary>Hint 2</summary>
Map each task to a wrapper that removes itself from the active set upon completion, then conditionally awaits when the pool is full.
</details>

<details>
<summary>Hint 3</summary>
Store results by index to preserve ordering. Iterate through tasks sequentially, but only `await` when the active count hits the limit.
</details>
