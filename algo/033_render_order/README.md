# 033. Render Order

**Difficulty:** Easy
**Topics:** Trees, DFS, Traversal Orders

---

## Description

A renderer walks a layout tree and needs its node ids in three classic
orders: pre-order (visit a node before its children — the order components
*mount*), in-order (left subtree, node, right subtree), and post-order (visit
a node after its children — the order cleanup/unmount effects fire). Because
in-order is only well-defined when every node has a distinct left and right
slot, this task uses a **binary** layout tree with `left` / `right` children
rather than an n-ary `children` array. Return all three orders from a single
function so the caller can compare them side by side.

## Examples

```ts
const tree = {
  id: 'root',
  left: { id: 'a', left: null, right: { id: 'b', left: null, right: null } },
  right: { id: 'c', left: null, right: null },
};

renderOrder(tree);
// {
//   preOrder:  ['root', 'a', 'b', 'c'],
//   inOrder:   ['a', 'b', 'root', 'c'],
//   postOrder: ['b', 'a', 'c', 'root'],
// }

renderOrder(null);
// { preOrder: [], inOrder: [], postOrder: [] }
```

## Constraints

- `0 <= number of nodes <= 100_000`.
- Node `id`s are unique non-empty strings.
- `left` and `right` are either a node or `null`, never `undefined`.
- An empty tree (`null` root) yields three empty arrays.

## Target

O(n) time — each of the three orders visits every node exactly once.

## Interviewer follow-up

Why does a real renderer mount components in pre-order but run
cleanup/unmount effects in post-order? What would break if unmount ran in
pre-order instead?
