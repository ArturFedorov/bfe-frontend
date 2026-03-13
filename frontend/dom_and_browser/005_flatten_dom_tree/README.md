# 5. Flatten DOM Tree

**Difficulty:** Easy
**Topics:** Tree Traversal, DFS, BFS

---

## Description

Given a tree structure representing a DOM-like tree, flatten it into an array using two different traversal orders:

- **`flattenDFS`**: Depth-First Search (pre-order) — visit the node, then recursively visit each child.
- **`flattenBFS`**: Breadth-First Search — visit all nodes at the current level before moving to the next level.

## Examples

```
Tree:
    1
   / \
  2   3
 /
4

flattenDFS(root)  // => [1, 2, 4, 3]
flattenBFS(root)  // => [1, 2, 3, 4]
```

## Constraints

- Each node has a `value` and an array of `children`
- Return an array of node values (not the nodes themselves)
- A single node with no children returns `[node.value]`

## Approach Hints

<details>
<summary>Hint 1</summary>
For DFS, use recursion: push the current value, then recurse into each child.
</details>

<details>
<summary>Hint 2</summary>
For BFS, use a queue: start with the root, dequeue a node, push its value, then enqueue all its children.
</details>

<details>
<summary>Hint 3</summary>
Both approaches should handle any number of children per node, not just binary trees.
</details>
