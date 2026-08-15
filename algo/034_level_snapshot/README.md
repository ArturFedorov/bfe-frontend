# 034. Level Snapshot

**Difficulty:** Easy
**Topics:** Trees, BFS, Queues

---

## Description

A design tool's layers panel shows the component tree grouped by nesting
level: level 0 is the root, level 1 its direct children, and so on. Given the
root of a component tree, return an array of levels, where each level is the
list of node ids at that depth, ordered left to right exactly as they appear
in their parents' `children` arrays (parents' own left-to-right order first).
This is a breadth-first snapshot of the tree — the data structure the panel
renders directly.

## Examples

```ts
const tree = {
  id: 'app',
  children: [
    { id: 'nav', children: [{ id: 'logo', children: [] }] },
    { id: 'main', children: [{ id: 'card', children: [] }, { id: 'aside', children: [] }] },
  ],
};

levelSnapshot(tree);
// [['app'], ['nav', 'main'], ['logo', 'card', 'aside']]

levelSnapshot({ id: 'solo', children: [] }); // [['solo']]
levelSnapshot(null);                          // []
```

## Constraints

- `0 <= number of nodes <= 100_000`.
- Node `id`s are unique non-empty strings.
- `children` is always an array (possibly empty).
- An empty tree (`null` root) returns `[]`.
- Within a level, ids must preserve left-to-right document order.

## Target

O(n) time, O(w) extra space for the queue where w is the widest level.

## Interviewer follow-up

Can you produce the same grouping with DFS instead of BFS? What do you gain
or lose, and does the left-to-right order within a level survive?
