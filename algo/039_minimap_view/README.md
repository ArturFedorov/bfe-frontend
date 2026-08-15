# 039. Minimap View

**Difficulty:** Medium
**Topics:** Trees, BFS, Level Tracking

---

## Description

An editor's minimap shows the component tree collapsed from the right edge:
at each depth level, only the level's last component is visible (levels read
left to right in document order, so "last" means the rightmost node of that
level). Given the root of a component tree, return the visible ids from top
level to bottom level. Careful: the rightmost node of a level is not
necessarily inside the rightmost subtree — a deep left branch can supply the
last node of the lower levels.

## Examples

```ts
const tree = {
  id: 'app', children: [
    { id: 'sidebar', children: [
      { id: 'nav', children: [{ id: 'deepLink', children: [] }] },
    ] },
    { id: 'content', children: [{ id: 'card', children: [] }] },
  ],
};

minimapView(tree);
// ['app', 'content', 'card', 'deepLink']
// depth 3 exists only in the LEFT subtree — 'deepLink' is that level's last node

minimapView({ id: 'solo', children: [] }); // ['solo']
minimapView(null);                          // []
```

## Constraints

- `0 <= number of nodes <= 100_000`.
- Node `id`s are unique non-empty strings.
- `children` is always an array (possibly empty).
- An empty tree (`null` root) returns `[]`.
- Exactly one id per existing depth level, ordered from depth 0 downward.

## Target

O(n) single traversal — no per-level rescans.

## Interviewer follow-up

The minimap flips to show the view from the left edge. What is the one-line
change in a BFS solution, and what changes in a DFS solution?
