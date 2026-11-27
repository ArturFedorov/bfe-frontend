# 032. Range Sum of BST (LeetCode 938)

**Difficulty:** Easy
**Topics:** Tree, Binary Search Tree, Depth-First Search

---

## Description

Given the root of a binary search tree and two integers `low` and `high`,
return the sum of the values of every node whose value lies in the inclusive
range `[low, high]`. Use the BST ordering: there is no need to look inside a
subtree that cannot contain values in the range.

## Examples

```ts
rangeSumBST(buildTree([10, 5, 15, 3, 7, null, 18]), 7, 15);
// 32   (7 + 10 + 15)

rangeSumBST(buildTree([10, 5, 15, 3, 7, 13, 18, 1, null, 6]), 6, 10);
// 23   (6 + 7 + 10)

rangeSumBST(null, 0, 100); // 0
```

## Constraints

- `0 <=` number of nodes `<= 2 * 10^4` per LeetCode (tests go up to `10^5`).
- `1 <= node.val <= 10^5`; all values are unique.
- `1 <= low <= high <= 10^5`

## Target

O(n) worst case, but **prune**: if `node.val < low`, only the right subtree
can contribute; if `node.val > high`, only the left subtree can. With pruning
the work is O(h + k) for a narrow range (k = nodes in range). Tests check
this: one counts how many nodes you actually read in a balanced BST, and one
uses a 10^5-node right-skewed BST with a range near the root — an unpruned
recursive traversal overflows the stack there, and an unpruned traversal of
any kind reads far too many nodes in the counting test.

## Interviewer follow-up

- Write it iteratively with an explicit stack (no recursion depth risk on a skewed tree).
- Many range queries on the same static tree: precompute an in-order prefix-sum array and answer each in O(log n) with binary search.
- What if the tree is a plain binary tree, not a BST — what can no longer be pruned?
