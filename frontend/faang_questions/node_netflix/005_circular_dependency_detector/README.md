# N5. Circular Dependency Detector

**Difficulty:** Medium
**Topics:** Graphs, DFS, Cycle Detection

---

## Description

Traverse a dependency graph and detect all cycles. Report each cycle as the list
of nodes that form it.

## Examples

```ts
findCycles({ a: ['b'], b: ['c'], c: ['a'] });
// [['a', 'b', 'c']]  (rotation may vary)
findCycles({ a: ['b'], b: [] });
// []
```

## Constraints

- Use DFS with a recursion/visiting stack ("gray" set) to detect back-edges.
- Handle self-loops (`a -> a`).
