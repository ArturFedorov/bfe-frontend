# 041. Making A Large Island (LeetCode 827)

**Difficulty:** Hard
**Topics:** Graph, DFS/BFS, Union Find, Matrix

---

## Description

You are given an `n x n` binary matrix `grid` where `1` is land and `0` is
water. An island is a maximal group of land cells connected horizontally or
vertically (4-directionally). You may change **at most one** `0` into a `1`.
Return the size (number of cells) of the largest island that can exist after
that single optional flip.

If the grid has no water, nothing can be flipped and the answer is simply
`n * n`. Do not mutate the caller's grid.

## Examples

```ts
largestIsland([
  [1, 0],
  [0, 1],
]); // 3  (flip either 0 to join both 1-cell islands)

largestIsland([
  [1, 1],
  [1, 0],
]); // 4  (flip the only 0)

largestIsland([
  [1, 1],
  [1, 1],
]); // 4  (no water to flip)

largestIsland([[0]]); // 1
```

## Constraints

- `n == grid.length == grid[i].length`
- `1 <= n <= 500`
- `grid[i][j]` is `0` or `1`.

## Target

O(n^2) time, O(n^2) space. One pass labels every island with an id and
records its area in a map; a second pass, for each `0`, sums the areas of the
**distinct** neighbouring island ids plus one. The large-input test (500×500)
will time out a brute force that flips each `0` and re-runs a full flood fill
(O(n^4)). Use an iterative flood fill — recursive DFS can blow the call stack
on a 250 000-cell island.

## Interviewer follow-up

- Why must neighbouring island ids be de-duplicated before summing? Give a grid where one island touches a `0` from two sides.
- What if you may flip up to **k** zeros? (No longer a clean O(n^2) — discuss search/heuristics.)
- Solve it with Union-Find instead of id labelling; compare the trade-offs.
