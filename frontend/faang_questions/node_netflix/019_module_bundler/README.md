# N19. Simplified Module Bundler

**Difficulty:** Hard
**Topics:** Graphs, Topological Sort, Bundling

---

## Description

From an entry module, resolve the dependency graph and produce a topological
ordering (dependencies first), as a bundler would before concatenation.

## Examples

```ts
bundleOrder({ entry: { id: 'entry', deps: ['a'] }, a: { id: 'a', deps: [] } }, 'entry');
// ['a', 'entry']
```

## Constraints

- Every dependency must appear before its dependents.
- Throw when a cycle is detected.
