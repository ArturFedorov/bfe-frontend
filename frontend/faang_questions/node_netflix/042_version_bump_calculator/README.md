# N42. Version Bump Calculator

**Difficulty:** Medium
**Topics:** Semver, Conventional Commits

---

## Description

Determine the next semantic version from the current version and commit history,
per conventional-commit rules.

## Examples

```ts
nextVersion('1.2.3', ['feat: x']); // '1.3.0'
nextVersion('1.2.3', ['feat!: x']); // '2.0.0'
```

## Constraints

- Breaking (`!` or `BREAKING CHANGE`) -> major; `feat` -> minor; else patch.
- Reset lower components on a higher bump.
