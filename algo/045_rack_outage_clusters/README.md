# 045. Rack Outage Clusters

**Difficulty:** Medium
**Topics:** Grid Graphs, BFS/DFS, Connected Components

---

## Description

A datacenter rack is monitored as a 2D grid where every machine reports either `'ok'` or
`'failed'`. When failures happen, operations wants to know how many independent incidents they are
dealing with: a **cluster** is a maximal group of failed machines connected 4-directionally
(up/down/left/right — diagonals do not connect). Count the number of failure clusters in the grid.
The grid is an implicit graph: there is no adjacency list to build, neighbors are computed from
coordinates on the fly.

## Examples

```ts
countOutageClusters([
  ['failed', 'ok', 'failed'],
  ['failed', 'ok', 'ok'],
  ['ok', 'ok', 'failed'],
]); // 3

countOutageClusters([
  ['failed', 'failed'],
  ['failed', 'failed'],
]); // 1

countOutageClusters([]); // 0
```

## Constraints

- Grid up to 500 × 500; every row has the same length.
- Cells are exactly `'ok'` or `'failed'`.
- Connectivity is 4-directional only — diagonal neighbors belong to different clusters.
- The empty grid (`[]` or `[[]]`) has 0 clusters; an all-`'ok'` grid has 0 clusters.
- A single failed machine is a cluster of size 1.
- Mutating the input grid as a visited marker is allowed; each test passes a fresh grid.

## Target

O(rows × cols) time; each cell visited a constant number of times.

## Interviewer follow-up

Your DFS recursion blows the call stack on a 500 × 500 all-failed grid — what do you change, and does the complexity change with it?
