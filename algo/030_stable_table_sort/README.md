# 030. Stable Table Sort

**Difficulty:** Medium
**Topics:** Merge Sort, Stability, Comparators

---

## Description

A data-table component lets users click column headers to sort, and the product
requirement is the one every spreadsheet honors: sorting by one column must
**preserve the existing order** of rows that compare equal — so a user can sort
by team, then by score, and rows keep the team grouping within equal scores.
Implement `stableMergeSort` yourself: a classic top-down merge sort over an
array of rows with a caller-supplied comparator. **`Array.prototype.sort` is
forbidden** (the tests spy on it) — the point of the exercise is writing the
split/merge recursion and making the merge step stable: when two elements
compare equal, the one from the **left half goes first**.

## Examples

```ts
const rows: TableRow[] = [
  { id: 1, team: 'red', score: 50 },
  { id: 2, team: 'blue', score: 90 },
  { id: 3, team: 'red', score: 90 },
];

stableMergeSort(rows, (a, b) => b.score - a.score);
// [ id 2 (90), id 3 (90), id 1 (50) ] — ids 2 and 3 tie on score,
// so they keep their original order

stableMergeSort([3, 1, 2], (a, b) => a - b); // [1, 2, 3] — generic over T
```

## Constraints

- `0 <= rows.length <= 100_000`
- Generic: `stableMergeSort<T>(rows, compare)` must work for any element type
- `compare` follows the standard contract: negative → `a` first, positive → `b` first, zero → equal
- **Stability is required:** elements comparing equal keep their original relative order
- **`Array.prototype.sort` (and `toSorted`) are forbidden** — implement merge sort by hand
- Return a new array; do not mutate the input

## Target

O(n log n) time, O(n) extra space.

## Interviewer follow-up

Why does chaining two sorts (first by column B, then stably by column A) yield
the same result as one multi-key sort by (A, then B) — and what breaks if the
second sort is not stable?
