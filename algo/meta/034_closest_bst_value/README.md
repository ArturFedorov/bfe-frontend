# 034. Closest Binary Search Tree Value (LeetCode 270)

**Difficulty:** Easy
**Topics:** Tree, Binary Search Tree, Binary Search

---

## Description

Given the root of a binary search tree and a (possibly fractional) `target`, return the
node value that is closest to `target`. If two values are equally close, return the
**smaller** one.

## Examples

```ts
closestValue(buildTree([4, 2, 5, 1, 3]), 3.714286);
// 4

closestValue(buildTree([1]), 4.428571);
// 1

closestValue(buildTree([4, 2, 5, 1, 3]), 3.5);
// 3  (3 and 4 tie — smaller wins)
```

## Constraints

- Number of nodes is in `[1, 10^4]`.
- `0 <= node.val <= 10^9`; values are unique and form a valid BST.
- `-10^9 <= target <= 10^9`.

## Target

O(h) time, O(1) space — walk a single root-to-leaf path, steering by the BST property.
A full traversal is O(n) and misses the point (tests won't catch it, the interviewer will).

## Interviewer follow-up

- **Closest BST Value II (LC 272):** return the `k` closest values — in-order traversal with a sliding window / deque, or two stacks of predecessors and successors for O(h + k).
- Why does the walk never need to backtrack? Prove the answer is on the search path.
