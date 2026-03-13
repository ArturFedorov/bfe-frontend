# 7. Async Generator for Streaming Data

**Difficulty:** Hard
**Topics:** Async Generators, AsyncIterator, Streaming, Pagination

---

## Description

Implement an async generator function `streamData` that repeatedly calls a `fetcher` function to retrieve batches of data. The fetcher returns `{ data: T[], done: boolean }`. The generator should yield each item individually and stop when `done` is `true`.

## Examples

```ts
let page = 0;
const fetcher = async () => {
  page++;
  if (page === 1) return { data: [1, 2], done: false };
  return { data: [3], done: true };
};

for await (const item of streamData(fetcher)) {
  console.log(item); // 1, 2, 3
}
```

## Constraints

- The generator yields individual items, not arrays
- Fetcher is called repeatedly until `done` is `true`
- Items from the final batch (where `done` is true) should still be yielded
- If the fetcher throws, the error should propagate to the consumer

## Approach Hints

<details>
<summary>Hint 1</summary>
Use a `while` loop that calls the fetcher, then yields each item from the returned data array using a `for...of` loop.
</details>

<details>
<summary>Hint 2</summary>
Check the `done` flag after yielding all items in the batch. Break out of the while loop when done.
</details>

<details>
<summary>Hint 3</summary>
Since this is an `async function*`, you can use `await` for the fetcher call and `yield` for each item naturally. Errors will propagate automatically.
</details>
