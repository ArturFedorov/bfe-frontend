# N14. Dependency Diff Reporter

**Difficulty:** Medium
**Topics:** Diffing, Risk Assessment, Security

---

## Description

Compare `node_modules` before/after an install and report the packages that were
newly added, each with a basic risk label.

## Examples

```ts
reportNewPackages({ a: '1.0.0' }, { a: '1.0.0', evil: '0.0.1' }, ['evil']);
// [{ name: 'evil', version: '0.0.1', risk: 'high' }]
```

## Constraints

- Only report packages present in `after` but not `before`.
- Mark as `high` risk when the name is in the `knownRisky` list, else `low`.
- Return results sorted by package name.
