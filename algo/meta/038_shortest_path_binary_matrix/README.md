# 038. Shortest Path in Binary Matrix (LeetCode 1091)

**Difficulty:** Medium
**Topics:** Array, Breadth-First Search, Matrix

---

## Description

Given an `n x n` grid of `0`s (open) and `1`s (blocked), find the length of the shortest
clear path from the top-left cell `(0, 0)` to the bottom-right cell `(n-1, n-1)`. A
clear path visits only `0` cells, and consecutive cells must be **8-directionally**
adjacent (sharing an edge or a corner). The length of a path is the number of cells it
visits. Return `-1` if no clear path exists.

## Examples

```ts
shortestPathBinaryMatrix([[0, 1], [1, 0]]);
// 2  (diagonal step)

shortestPathBinaryMatrix([[0, 0, 0], [1, 1, 0], [1, 1, 0]]);
// 4

shortestPathBinaryMatrix([[1, 0, 0], [1, 1, 0], [1, 1, 0]]);
// -1  (start is blocked)
```

## Constraints

- `n == grid.length == grid[i].length`, `1 <= n <= 300` in tests.
- `grid[i][j]` is `0` or `1`.

## Target

O(n²) time and space — plain BFS from `(0, 0)`, marking cells visited when they are
enqueued. The 300×300 open-grid test will time out a DFS/backtracking search, and an
`Array.shift()`-based queue is noticeably slower — use a head index.

## Interviewer follow-up

- Return the path itself (keep a parent pointer per cell).
- A* with Chebyshev distance as the heuristic — when does it beat BFS?
- Bidirectional BFS: why does it help on large open grids?
