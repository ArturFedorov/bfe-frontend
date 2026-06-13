# N4. Dependency Graph Builder

**Difficulty:** Medium
**Topics:** Graphs, Data Modeling

---

## Description

Given a set of `package.json`-like objects, build a directed graph mapping each
package name to the list of names it depends on.

## Examples

```ts
buildGraph([
  { name: 'a', version: '1.0.0', dependencies: { b: '^1.0.0' } },
  { name: 'b', version: '1.0.0' },
]);
// { a: ['b'], b: [] }
```

## Constraints

- Every package should appear as a key, including leaves with no dependencies.
- Only the dependency names matter for the graph (versions are out of scope here).
