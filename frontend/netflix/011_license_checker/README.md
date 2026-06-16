# N11. License Checker

**Difficulty:** Medium
**Topics:** Policy, Traversal, Compliance

---

## Description

Traverse dependencies, read their `license` field, and flag licenses that are
incompatible with the project's own license.

## Examples

```ts
checkLicenses('MIT', [{ name: 'b', license: 'GPL-3.0' }]);
// ['b']
```

## Constraints

- Treat GPL / AGPL / LGPL family as incompatible with a permissive (MIT/Apache) project.
- Keep the policy simple and explicit; real-world checks are far more nuanced.
