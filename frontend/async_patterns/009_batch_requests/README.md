# 9. Batch Requests

**Difficulty:** Medium
**Topics:** Promises, Batching, Array Chunking

---

## Description

Implement a `batchRequests` function that splits an array of items into batches of a given size, processes each batch sequentially using the provided async function, and combines all results into a single array.

## Examples

```ts
const results = await batchRequests(
  [1, 2, 3, 4, 5],
  2,
  async (batch) => batch.map((n) => n * 2)
);
// Batches: [1,2], [3,4], [5]
// results: [2, 4, 6, 8, 10]
```

## Constraints

- `batchSize` is a positive integer
- Batches are processed sequentially (one at a time)
- The last batch may be smaller than `batchSize`
- Results from all batches are concatenated in order
- Empty items array returns an empty results array

## Approach Hints

<details>
<summary>Hint 1</summary>
First, chunk the items array into sub-arrays of length `batchSize`. You can use a simple loop with `slice`.
</details>

<details>
<summary>Hint 2</summary>
Iterate through the chunks sequentially, awaiting the `fn` call for each batch, and concatenate the results.
</details>

<details>
<summary>Hint 3</summary>
Use `Array.reduce` with an async accumulator, or a `for...of` loop to process batches one at a time.
</details>
