# 036. Convert BST to Sorted Circular Doubly Linked List (LeetCode 426)

**Difficulty:** Medium
**Topics:** Tree, Binary Search Tree, In-order Traversal, Linked List

---

## Description

Convert a binary search tree into a sorted, **circular**, doubly linked list **in place**.
Reuse the tree nodes: `left` becomes the pointer to the previous element and `right` the
pointer to the next. The smallest element's `left` points to the largest, and the
largest element's `right` points back to the smallest. Return the node with the
smallest value (the head), or `null` for an empty tree. Do not allocate new nodes.

## Examples

```ts
const head = treeToDoublyList(buildTree([4, 2, 5, 1, 3]));
// head.val === 1
// forward via .right:  1 -> 2 -> 3 -> 4 -> 5 -> (back to 1)
// backward via .left:  1 -> 5 -> 4 -> 3 -> 2 -> (back to 1)

treeToDoublyList(buildTree([2, 1, 3])); // 1 <-> 2 <-> 3, circular
treeToDoublyList(null);                 // null
```

## Constraints

- Number of nodes is in `[0, 2000]` (tests include one larger tree).
- `-1000 <= node.val <= 1000` in the examples; values are unique.
- The input is a valid BST.
- Must be in place: the returned list's nodes are the original tree nodes.

## Target

O(n) time, O(h) space — one in-order traversal keeping a `prev` pointer and linking
`prev.right = node; node.left = prev`, then closing the circle with `first`/`last`.

## Interviewer follow-up

- Do it iteratively with an explicit stack (no recursion).
- Non-circular variant: just skip the final `first`/`last` link.
- Reverse problem: Convert Sorted List to BST (LC 109) — build a height-balanced tree.
