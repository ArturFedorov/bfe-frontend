# 051. Has Dependency

**Difficulty:** Very Easy
**Topics:** Graphs, Reachability, DFS/BFS

---

## Description

You maintain the dependency auditor for a package manager. A package manifest maps
each package to the packages it directly depends on. Security advisories arrive as
"package `b` is vulnerable" and you must answer: does package `a` depend on `b`,
either directly or through any chain of intermediate packages? Real-world manifests
occasionally contain dependency cycles, so the check must terminate and still answer
correctly instead of looping forever.

## Examples

```ts
const manifest = {
  app: ['ui', 'api'],
  ui: ['utils'],
  api: ['utils'],
  utils: [],
};

hasDependency(manifest, 'app', 'utils'); // true  (app -> ui -> utils)
hasDependency(manifest, 'utils', 'app'); // false (edges are directed)
hasDependency(manifest, 'ui', 'api');    // false (siblings, no path)
```

## Constraints

- Input is `Record<string, string[]>`: each key depends on every id in its array; every id that appears in an array is also a key.
- Cycles may be present — the function must terminate and never throw.
- `hasDependency(g, x, x)` is `true` only when `x` sits on a cycle, i.e. there is a path of **one or more edges** from `x` back to `x`.
- Unknown package ids return `false`.
- Deterministic, pure — do not mutate the input graph.

## Target

O(V + E) time, O(V) space.

## Interviewer follow-up

If the same manifest had to serve millions of `hasDependency` queries, what would you precompute and what is the space trade-off?
