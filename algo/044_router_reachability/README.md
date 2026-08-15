# 044. Router Reachability

**Difficulty:** Medium
**Topics:** Graphs, BFS/DFS, Geometry, Implicit Graphs

---

## Description

A mesh network is deployed as a set of wireless routers, each at a fixed `(x, y)` position with its
own transmission range. Router A can transmit a packet directly to router B when the euclidean
distance between them is **at most A's own range**. Because every router has its own range, links
are **not symmetric**: a long-range router can reach a short-range one that cannot answer back —
the resulting graph is **directed**, and treating it as undirected is the classic mistake here.
Given the router list, a source id, and a target id, determine whether a packet starting at the
source can reach the target through any chain of hops.

## Examples

```ts
const routers = [
  { id: 'a', x: 0, y: 0, range: 10 },
  { id: 'b', x: 8, y: 0, range: 1 },
  { id: 'c', x: 9, y: 0, range: 2 },
];
canReach(routers, 'a', 'b'); // true  (a → b directly: distance 8 ≤ 10)
canReach(routers, 'b', 'a'); // false (b's range is 1 — the link is one-way)
canReach(routers, 'b', 'c'); // true  (distance 1 ≤ 1; boundary counts)
```

## Constraints

- 0 to ~2,000 routers; ids are unique non-empty strings.
- Coordinates and ranges are finite numbers; `range ≥ 0`.
- The graph is **directed**: edge A → B exists iff `dist(A, B) ≤ A.range`. Do not assume symmetry.
- A hop of distance exactly equal to the range succeeds (`≤`, not `<`).
- Disconnected clusters and cycles are allowed; traversal must terminate on cyclic topologies.
- `source === target` returns `true` when that router exists.
- Return `false` if the source or target id is not in the list.

## Target

O(n²) to build the proximity graph + O(V + E) for the traversal.

## Interviewer follow-up

The fleet grows to 1,000,000 routers and the O(n²) edge construction becomes the bottleneck — what spatial structure would you use to find each router's neighbors faster?
