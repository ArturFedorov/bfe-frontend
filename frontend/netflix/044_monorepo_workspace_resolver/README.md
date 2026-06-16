# N44. Monorepo Workspace Resolver

**Difficulty:** Medium
**Topics:** Monorepo, Graphs, Semver

---

## Description

Discover packages from a `workspaces` field, build the graph of inter-workspace
dependencies, and detect version mismatches between siblings.

## Examples

```ts
resolveWorkspaces(packages);
// { internalGraph: {...}, mismatches: [{ from, to, required, actual }] }
```

## Constraints

- Only edges between workspace packages count (ignore external deps in the graph).
- A mismatch is when a sibling's actual version does not satisfy the requested range.
