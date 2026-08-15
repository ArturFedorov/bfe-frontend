# 048. Outage Spread

**Difficulty:** Medium
**Topics:** Multi-Source BFS, Grid Graphs, Simulation

---

## Description

A cascading failure is ripping through a server room. The room is a 2D grid where each cell is
either a server (identified by a unique string id) or an empty slot (`null`) that blocks the
cascade. At minute 0, a given set of servers is already failed. Every minute, the failure spreads
from each failed server to every 4-directionally adjacent server simultaneously. Compute how many
minutes pass until the outage stops spreading, and which servers are never affected — because an
empty slot or the room boundary isolates them. This is a multi-source BFS: all initial failures
expand as one frontier, and the answer is the depth of the last wave, not n separate traversals.

## Examples

```ts
outageSpread({
  grid: [
    ['a', 'b', 'c'],
    ['d', null, 'e'],
    ['f', 'g', 'h'],
  ],
  initialFailures: ['a'],
});
// { minutes: 4, unaffected: [] }
// a → b,d (1) → c,f (2) → e,g (3) → h (4)

outageSpread({
  grid: [
    ['a', null, 'b'],
  ],
  initialFailures: ['a'],
});
// { minutes: 0, unaffected: ['b'] }  — the empty slot isolates b; nothing spreads

outageSpread({ grid: [['a', 'b']], initialFailures: [] });
// { minutes: 0, unaffected: ['a', 'b'] }
```

## Constraints

- Grid up to 500 × 500; rows have equal length; cell values are unique server ids or `null`.
- Spread is 4-directional and simultaneous from **all** failed servers each minute (multi-source).
- `minutes` is the minute of the **last new infection** — 0 when nothing new is ever infected
  (no initial failures, all servers already failed, or every neighbor blocked).
- `unaffected` lists server ids never infected, sorted alphabetically — servers behind empty
  slots or in disconnected regions survive.
- `initialFailures` ids are guaranteed to exist in the grid; the list may be empty.
- The empty grid returns `{ minutes: 0, unaffected: [] }`.

## Target

O(rows × cols) — each cell enters the BFS queue at most once.

## Interviewer follow-up

Why does running a separate BFS from each initial failure and taking minimums per cell give the same `minutes`, and what does it cost compared to the single multi-source frontier?
