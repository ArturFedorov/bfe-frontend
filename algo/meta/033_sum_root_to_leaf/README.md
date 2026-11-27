# 033. Sum Root to Leaf Numbers (LeetCode 129)

**Difficulty:** Medium
**Topics:** Tree, Depth-First Search, Binary Tree

---

## Description

Every node of a binary tree holds a single digit `0`–`9`. Each root-to-leaf path spells
a decimal number by reading the digits from the root down — the path `4 → 9 → 5`
represents `495`. Return the sum of the numbers formed by **all** root-to-leaf paths.
A leaf is a node with no children. An empty tree sums to `0`.

## Examples

```ts
sumNumbers(buildTree([1, 2, 3]));
// 25  (12 + 13)

sumNumbers(buildTree([4, 9, 0, 5, 1]));
// 1026  (495 + 491 + 40)

sumNumbers(buildTree([0]));
// 0
```

## Constraints

- Number of nodes is in `[0, 1000]`.
- `0 <= node.val <= 9`.
- Tree depth is at most `10`, so every path number fits in a 32-bit integer.

## Target

O(n) time, O(h) space — one DFS that carries `current * 10 + val` down the tree.

## Interviewer follow-up

- Do it iteratively (explicit stack of `[node, valueSoFar]` pairs) — no recursion.
- Can you do it in O(1) extra space? (Morris traversal — discuss, not usually coded.)
- What changes if depth can exceed 15 (number no longer fits a double exactly)? Use `BigInt` or strings.
