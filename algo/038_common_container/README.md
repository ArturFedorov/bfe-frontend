# 038. Common Container

**Difficulty:** Medium
**Topics:** Trees, Lowest Common Ancestor, DFS

---

## Description

In a page editor the user multi-selects two elements, and the editor must
highlight the smallest container that encloses both — for example to group
them or apply a shared style. Given the root of a component tree and two node
ids, return the id of their nearest common ancestor container. A node counts
as its own ancestor: if one selected element contains the other, the outer
one is the answer, and selecting the same element twice returns that element.
Throw an `Error` if either id does not exist in the tree.

## Examples

```ts
const tree = {
  id: 'page', children: [
    { id: 'nav', children: [{ id: 'logo', children: [] }] },
    { id: 'main', children: [
      { id: 'card', children: [{ id: 'title', children: [] }, { id: 'button', children: [] }] },
      { id: 'aside', children: [] },
    ] },
  ],
};

commonContainer(tree, 'title', 'button'); // 'card'
commonContainer(tree, 'logo', 'aside');   // 'page'
commonContainer(tree, 'main', 'button');  // 'main' (ancestor of the other)
```

## Constraints

- `1 <= number of nodes <= 100_000`.
- Node `id`s are unique non-empty strings.
- Both queried ids may be equal — the answer is that id.
- Throw if either id is not present in the tree.
- Nodes have no parent pointers — you only have the root.

## Target

O(n) time, single traversal — do not compute two root-to-node paths in two
separate walks.

## Interviewer follow-up

The editor now runs millions of LCA queries on the same static tree. What
would you precompute to answer each query faster than O(n)?
