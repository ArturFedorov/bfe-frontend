# 018. Diagonal Traverse (LeetCode 498)

**Difficulty:** Medium
**Topics:** Array, Matrix, Simulation

---

## Description

Given an `m x n` matrix `mat`, return all of its elements in **zig-zag diagonal
order**. Diagonals are the groups of cells with the same `row + col` sum, visited in
increasing order of that sum (0, 1, 2, …). The direction alternates: diagonal `d = 0`
is walked going **up-right** (from bottom-left to top-right), diagonal `d = 1` going
**down-left** (from top-right to bottom-left), then up-right again, and so on.

## Examples

```ts
findDiagonalOrder([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]);
// [1, 2, 4, 7, 5, 3, 6, 8, 9]

findDiagonalOrder([
  [1, 2],
  [3, 4],
]);
// [1, 2, 3, 4]

findDiagonalOrder([[1, 2, 3]]); // [1, 2, 3]
```

## Constraints

- `m == mat.length`, `n == mat[i].length`
- `1 <= m, n <= 10^4`, `1 <= m * n <= 10^4` (the tests also use larger matrices)
- `-10^5 <= mat[i][j] <= 10^5`
- Return an empty array for an empty matrix (`[]`).
- Do not mutate the input.

## Target

O(m·n) time, O(1) extra space besides the output. Iterate `d = 0 … m + n - 2` and
walk each diagonal directly from its start cell, or simulate the bouncing pointer.
Collecting each diagonal into a temporary array and reversing it is fine too
(O(min(m, n)) extra). Wrong boundary handling at the corners is the usual bug.

## Interviewer follow-up

- Diagonal Traverse II (LC 1424): a jagged list of rows — why does grouping by `r + c` (or BFS) beat simulation there?
- Return the anti-diagonals without the zig-zag (all top-right to bottom-left).
- Can you do it in a single pass with no reversing and no temporary arrays?
