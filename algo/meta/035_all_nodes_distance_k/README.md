# 035. All Nodes Distance K in Binary Tree (LeetCode 863)

**Difficulty:** Medium
**Topics:** Tree, Depth-First Search, Breadth-First Search, Hash Table

---

## Description

Given the root of a binary tree, a reference to a `target` node inside that tree, and an
integer `k`, return the values of all nodes whose distance from `target` is exactly `k`
edges. Paths may go up through parents as well as down through children. The result may
be in any order.

## Examples

```ts
const root = buildTree([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]);
distanceK(root, findNode(root, 5)!, 2);
// [7, 4, 1]  (any order)

const single = buildTree([1]);
distanceK(single, single!, 3);
// []
```

## Constraints

- Number of nodes is in `[1, 500]` for the examples; tests include one much larger tree.
- Node values are unique, `0 <= node.val <= 10^6`.
- `target` is a node in the tree. `0 <= k <= 1000`.

## Target

O(n) time, O(n) space — record each node's parent (one DFS), then BFS `k` levels out from
`target` treating the tree as an undirected graph. The large test uses a deep tree, so
prefer iterative traversals over deep recursion.

## Interviewer follow-up

- Do it without a parent map: one DFS that returns the distance from each subtree to `target`, then collects nodes at `k - dist` on the other side.
- What if `target` is given as a value instead of a node reference?
