# N47. Node.js Version Compatibility Checker

**Difficulty:** Easy
**Topics:** Semver, engines, Migrations

---

## Description

Parse `engines.node` from each package and report which ones are incompatible
with a target Node.js version — the kind of check an LTS migration runs.

## Examples

```ts
checkEngines([{ name: 'b', engines: { node: '>=20.0.0' } }], '18.17.0');
// ['b']
```

## Constraints

- Packages without `engines.node` are compatible by default.
- Reuse your `satisfies()` range matcher from N3.
