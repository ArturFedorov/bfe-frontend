# N63. CI pipeline config generator

**Difficulty:** Medium
**Topics:** Monorepos, Graphs, Affected Detection

---

## Description

Given a monorepo's package graph and a set of changed packages, generate a CI
plan that builds/tests only the affected packages — the changed packages plus
everything that depends on them, transitively.

## Examples

```ts
const graph = { utils: [], api: ['utils'], web: ['api'], docs: [] };
generateCiPlan(graph, ['utils']).affected; // ['api', 'utils', 'web'] (any order)
```

## Constraints

- `graph[pkg]` lists the packages `pkg` depends on.
- Compute reverse dependents transitively; include the changed packages too.
