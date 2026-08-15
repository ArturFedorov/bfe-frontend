# 036. Symmetric Layout Check

**Difficulty:** Medium
**Topics:** Trees, Twin-cursor Recursion, Structural Comparison

---

## Description

A design-review bot flags layouts that claim to be centered but are not
actually mirror-symmetric. A layout tree is symmetric when it reads the same
mirrored around its vertical center: for every pair of mirrored nodes, the
`type`s match and their children mirror each other in **opposite** order (the
first child of one pairs with the last child of the other, and so on —
recursively). This is an n-ary tree, so a node with an odd number of children
has a middle child that must itself be mirror-symmetric. Implement the check
with twin-cursor recursion: walk two subtrees at once in opposite directions.

## Examples

```ts
const symmetric = {
  type: 'row', children: [
    { type: 'card', children: [{ type: 'img', children: [] }] },
    { type: 'hero', children: [] },
    { type: 'card', children: [{ type: 'img', children: [] }] },
  ],
};
isSymmetricLayout(symmetric); // true

const lopsided = {
  type: 'row', children: [
    { type: 'card', children: [{ type: 'img', children: [] }] },
    { type: 'card', children: [] }, // missing the mirrored img
  ],
};
isSymmetricLayout(lopsided); // false

isSymmetricLayout(null); // true (an empty layout is trivially symmetric)
```

## Constraints

- `0 <= number of nodes <= 100_000`.
- `type` is a non-empty string; nodes are compared by `type` only.
- `children` is always an array (possibly empty).
- An empty tree (`null`) and a single node are both symmetric.
- Mirrored pairs must match in `type` **and** child count.

## Target

O(n) time — each node is visited a constant number of times.

## Interviewer follow-up

Rewrite the check iteratively with an explicit stack of node pairs — what
exactly goes on the stack, and in what order do you push children?
