# 030. Binary Tree Vertical Order Traversal (LeetCode 314)

**Difficulty:** Medium
**Topics:** Tree, Breadth-First Search, Hash Table

---

## Description

Give every node of a binary tree a column: the root is column `0`, a left
child is its parent's column `- 1`, and a right child is its parent's column
`+ 1`. Return the node values grouped by column, columns ordered from
leftmost to rightmost.

Inside one column, values are ordered **top to bottom** (by depth). When two
nodes share both column and depth, the one further **left** in that level
comes first — exactly the order a level-order (BFS) traversal meets them.
Values are **not** sorted within a column.

## Examples

```ts
verticalOrder(buildTree([3, 9, 20, null, null, 15, 7]));
// [[9], [3, 15], [20], [7]]

verticalOrder(buildTree([3, 9, 8, 4, 0, 1, 7]));
// [[4], [9], [3, 0, 1], [8], [7]]   (0 and 1 share column and depth: left first)

verticalOrder(buildTree([1, 2, 3, null, 4, null, null, null, 5]));
// [[2], [1, 4], [3, 5]]   (3 is shallower than 5, so it comes first even though
//                          5 sits in the left subtree)

verticalOrder(null); // []
```

## Constraints

- `0 <=` number of nodes `<= 100` per LeetCode (tests go up to `10^5`).
- `-100 <= node.val <= 100`; values may repeat.

## Target

O(n) time, O(n) space: BFS carrying each node's column, appending to a
column → values map, and tracking the min/max column so no sort of the keys
is needed (O(n log n) if you sort them — acceptable, but say so). A DFS
preorder gets the tie-break wrong (it visits a deep left-subtree node before
a shallower right-subtree node in the same column), and recursion overflows
on the 10^5-deep skewed tree in the tests.

## Interviewer follow-up

- LC 987 Vertical Order Traversal: same-row, same-column ties are broken by **value** — what changes? (Collect `(col, row, val)` and sort.)
- Can you avoid sorting columns entirely? (Track min/max column; offset into an array.)
- If DFS is required, what must you record per node to reproduce BFS order? (Depth, then sort stably by depth within each column.)
