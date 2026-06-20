# LC 130. Surrounded Regions

**Difficulty:** Medium
**Topics:** Matrix, DFS, BFS, Union-Find

---

## Description

Given an `m x n` matrix `board` containing `'X'` and `'O'`, capture all regions
that are **4-directionally surrounded** by `'X'`.

A region is captured by flipping all `'O'`s into `'X'`s in that surrounded
region. An `'O'` is **not** captured if it is connected (4-directionally) to an
`'O'` on the border of the board.

The board must be modified **in place**.

## Examples

```ts
const board = [
  ['X', 'X', 'X', 'X'],
  ['X', 'O', 'O', 'X'],
  ['X', 'X', 'O', 'X'],
  ['X', 'O', 'X', 'X'],
];
solve(board);
// board is now:
// [
//   ['X', 'X', 'X', 'X'],
//   ['X', 'X', 'X', 'X'],
//   ['X', 'X', 'X', 'X'],
//   ['X', 'O', 'X', 'X'],
// ]
// The bottom-left 'O' is on the border, so it (and anything connected) survives.
```

```ts
solve([['X']]); // [['X']]
```

## Constraints

- `m === board.length`
- `n === board[i].length`
- `1 <= m, n <= 200`
- `board[i][j]` is `'X'` or `'O'`.

## Approach

Any `'O'` that is reachable from a border `'O'` cannot be captured. Flood-fill
(DFS/BFS) from every border `'O'`, marking reachable cells as safe. Then sweep
the board: flip remaining `'O'`s to `'X'` (captured) and restore safe markers
back to `'O'`.

Time: `O(m * n)` — each cell visited a constant number of times.
Space: `O(m * n)` worst case for the recursion/queue.
