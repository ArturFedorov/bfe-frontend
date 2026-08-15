# 032. Component Depth

**Difficulty:** Very Easy
**Topics:** Trees, Recursion, DFS

---

## Description

Your team's linter warns when a component tree is nested too deeply — deep
nesting hurts render performance and readability. Given the root of a
component tree (each node has an `id` and a list of `children`), compute its
maximum nesting depth: the number of nodes on the longest path from the root
down to a leaf. A single component with no children has depth `1`, and an
empty tree (`null`) has depth `0`. The lint rule will compare this number
against a configured threshold.

## Examples

```ts
const tree = {
  id: 'app',
  children: [
    { id: 'header', children: [] },
    {
      id: 'main',
      children: [{ id: 'article', children: [{ id: 'p1', children: [] }] }],
    },
  ],
};

componentDepth(tree);                         // 4  (app → main → article → p1)
componentDepth({ id: 'solo', children: [] }); // 1
componentDepth(null);                         // 0
```

## Constraints

- `0 <= number of nodes <= 100_000`.
- Node `id`s are unique non-empty strings.
- `children` is always an array (possibly empty), never `undefined`.
- The input is a valid tree — no cycles, no shared nodes.
- An empty tree (`null` root) has depth `0`.

## Target

O(n) time, single traversal — visit every node exactly once.

## Interviewer follow-up

The design system ships trees up to a million nodes deep (a pathological
chain). Your recursive solution blows the call stack — rewrite it without
recursion.
