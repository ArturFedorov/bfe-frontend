# 037. Binary Tree Maximum Path Sum (LeetCode 124)

**Difficulty:** Hard
**Topics:** Tree, Depth-First Search, Dynamic Programming, Binary Tree

---

## Description

A *path* in a binary tree is a sequence of nodes where each adjacent pair is joined by an
edge, and no node appears more than once. A path need not pass through the root and
must contain at least one node. The path sum is the sum of the node values on it.
Given a non-empty binary tree, return the maximum path sum over all paths.

## Examples

```ts
maxPathSum(buildTree([1, 2, 3])!);
// 6  (2 -> 1 -> 3)

maxPathSum(buildTree([-10, 9, 20, null, null, 15, 7])!);
// 42  (15 -> 20 -> 7)

maxPathSum(buildTree([-3])!);
// -3
```

## Constraints

- Number of nodes is in `[1, 3 * 10^4]`.
- `-1000 <= node.val <= 1000`.
- Values may all be negative — the answer is then the largest single node.

## Target

O(n) time, O(h) space — one post-order DFS. Each call returns the best *downward* gain
from that node (clamped at 0 for each child), while updating a global best with
`node.val + leftGain + rightGain`.

## Interviewer follow-up

- Return the path itself (list of node values), not just the sum.
- Diameter of Binary Tree (LC 543) — the same "bend at this node" pattern with edge counts.
- What if the path must start at the root / end at a leaf?
