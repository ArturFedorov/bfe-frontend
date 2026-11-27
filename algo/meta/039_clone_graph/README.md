# 039. Clone Graph (LeetCode 133)

**Difficulty:** Medium
**Topics:** Graph, Hash Table, Depth-First Search, Breadth-First Search

---

## Description

You are given a reference to one node of a connected, undirected graph. Each node has an
integer `val` and a list of `neighbors`. Return a **deep copy** of the graph: a brand-new
set of nodes with the same values and the same edge structure, where no returned node
(and no neighbor reachable from it) is one of the original nodes. Cycles and shared
neighbors must be preserved — each original node maps to exactly one clone.

Tests describe graphs with an adjacency list: node `i + 1` has neighbors `adj[i]`
(values are 1-indexed), and the given node is node `1`.

## Examples

```ts
// adjacency list [[2, 4], [1, 3], [2, 4], [1, 3]] — a 4-cycle
const copy = cloneGraph(node1);
// copy !== node1, copy.val === 1, copy.neighbors.map(n => n.val) == [2, 4]
// and copy.neighbors[0].neighbors[0] === copy  (the cycle is preserved)

cloneGraph(new GraphNode(1)); // a lone node with no neighbors
cloneGraph(null);             // null
```

## Constraints

- Number of nodes is in `[0, 100]` (tests include one larger graph).
- `node.val` is unique per node and equals its 1-based index.
- No repeated edges, no self-loops; the graph is connected.
- Neighbor order in each clone must match the original.

## Target

O(V + E) time and space — DFS or BFS with a `Map<original, clone>`; create the clone the
first time a node is seen, then wire neighbors through the map.

## Interviewer follow-up

- Do it iteratively with BFS (the large-graph test is deep enough that naive recursion may be fragile in other languages).
- Copy List with Random Pointer (LC 138) — the same "old→new map" idea on a list.
- What if the graph may be disconnected and you're given a list of all nodes?
