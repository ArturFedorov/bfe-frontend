# 050. Badge Access Path

**Difficulty:** Hard
**Topics:** State-Space BFS, Grid Graphs, Shortest Path

---

## Description

An office floor is a grid of open cells (`'.'`), walls (`'#'`), and locked doors (`'D'`). Your
badge has a one-time override: along your whole route you may walk through **at most one** locked
door; walls are never passable. Given the grid, a start cell, and an end cell (both open), return
the length of the shortest route in 4-directional steps, or `-1` if no route exists. The catch is
that plain BFS over positions is wrong here: the search state must be *(row, col, bypass-used)*,
because reaching a cell having already spent the bypass is strictly weaker than reaching it with
the bypass still available — a naive visited-set over positions alone will discard the stronger
state and miss valid routes.

## Examples

```ts
// '.' open, '#' wall, 'D' locked door
badgeAccessPath([
  ['.', 'D', '.'],
  ['.', '.', '.'],
], [0, 0], [0, 2]);
// 2 — through the door beats the 4-step detour

badgeAccessPath([
  ['.', 'D', 'D', '.'],
], [0, 0], [0, 3]);
// -1 — that route needs two doors and there is no other

badgeAccessPath([
  ['.', '#', '.'],
], [0, 0], [0, 2]);
// -1 — walls cannot be bypassed
```

## Constraints

- Grid up to 500 × 500; cells are exactly `'.'`, `'#'`, or `'D'`; rows have equal length.
- Movement is 4-directional; each move costs 1; the answer counts moves, not cells.
- At most **one** `'D'` cell may appear anywhere on the route; `'#'` is impassable always.
- `start` and `end` are `[row, col]` of open (`'.'`) cells; `start` equal to `end` returns `0`.
- Open areas contain cycles; the traversal must not revisit states.
- The empty grid (`[]` or `[[]]`) returns `-1`.
- Using the bypass is optional — never spend it when a clean route is as short.

## Target

O(rows × cols) time and space — each of the 2 × rows × cols states enters the queue at most once.

## Interviewer follow-up

Generalize to k bypasses: what is the state space and complexity, and at what k does this stop being practical for a 500 × 500 floor?
