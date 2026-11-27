# 031. Lowest Common Ancestor of a Binary Tree III (LeetCode 1650)

**Difficulty:** Medium
**Topics:** Tree, Hash Table, Two Pointers

---

## Description

Every node of a binary tree knows its `parent` (the root's `parent` is
`null`). You are given two nodes `p` and `q` from the same tree — but **not**
the root. Return their lowest common ancestor: the deepest node that has both
`p` and `q` as descendants, where a node counts as a descendant of itself.

## Examples

```ts
// Tree [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4] with parent pointers
lowestCommonAncestor(node5, node1); // node3
lowestCommonAncestor(node5, node4); // node5  (a node is its own ancestor)
lowestCommonAncestor(node7, node4); // node2
```

## Constraints

- The tree has between `2` and `10^5` nodes (tests go up to `10^5`).
- `-10^9 <= node.val <= 10^9`; values are unique in the tests.
- `p !== q`, and both are in the same tree.

## Target

O(h) time, where `h` is the tree height. The straightforward way stores all
ancestors of `p` in a `Set` and walks up from `q` (O(h) space). Iterate — a
recursive walk up a 10^5-deep chain (in the tests) overflows the stack.
Collecting ancestors into an array and calling `includes` on it for each of
`q`'s ancestors is O(h^2) and will be too slow on that chain.

## Interviewer follow-up

- Do it in **O(1) extra space**: two pointers `a = p`, `b = q`; step each to its parent, and when one runs off the root, restart it at the *other* starting node. Both travel `depth(p) + depth(q)` steps and meet at the LCA (same idea as LC 160 Intersection of Two Linked Lists).
- Alternative O(1)-space approach: compute both depths, lift the deeper node by the difference, then step both up together.
- No parent pointers, only the root (LC 236) — how does the recursion change?
