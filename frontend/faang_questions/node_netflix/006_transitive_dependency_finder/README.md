# N6. Transitive Dependency Finder

**Difficulty:** Medium
**Topics:** Graphs, BFS/DFS, Reachability

---

## Description

Given a dependency graph and a starting package, return all packages it depends
on directly or transitively.

## Examples

```ts
findTransitive({ a: ['b'], b: ['c'], c: [] }, 'a');
// ['b', 'c']
```

## Constraints

- Exclude the start node from the result.
- Guard against cycles so traversal terminates.
