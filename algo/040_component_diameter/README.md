# 040. Component Diameter

**Difficulty:** Medium
**Topics:** Trees, Post-order Recursion, Combine-children Answers

---

## Description

A performance audit measures how "stretched" a component tree is: the longest
chain between any two components, counted in **edges** (parent-child links).
The chain does not have to pass through the root — it can live entirely
inside one subtree. This is an n-ary tree, so at every node the longest chain
through that node combines its **two deepest** child subtrees (not just left
and right). Return the diameter: the maximum number of edges on any
node-to-node path.

## Examples

```ts
const tree = {
  id: 'app', children: [
    { id: 'a', children: [
      { id: 'a1', children: [{ id: 'a2', children: [] }] },
      { id: 'b1', children: [{ id: 'b2', children: [] }] },
    ] },
    { id: 'c', children: [] },
  ],
};

componentDiameter(tree); // 4  (a2 → a1 → a → b1 → b2, entirely inside subtree 'a')
componentDiameter({ id: 'solo', children: [] }); // 0
componentDiameter(null);                          // 0
```

## Constraints

- `0 <= number of nodes <= 100_000`.
- Node `id`s are unique non-empty strings.
- `children` is always an array (possibly empty).
- Distance is counted in edges: a single node has diameter `0`, an empty
  tree also `0`.
- A node may have any number of children — track its two deepest, not all
  pairs.

## Target

O(n) time, single post-order traversal — return depth up, fold diameter on
the way.

## Interviewer follow-up

Extend it: return not just the length but the actual path of ids realizing
the diameter — what extra bookkeeping does each node need to hand its parent?
