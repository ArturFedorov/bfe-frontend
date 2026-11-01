# N41. Changelog Generator

**Difficulty:** Medium
**Topics:** Parsing, Conventional Commits

---

## Description

Parse conventional-commit messages, group them by type, and generate a markdown
changelog.

## Examples

```ts
generateChangelog(['feat: add x', 'fix: bug']);
// "### Features\n- add x\n\n### Bug Fixes\n- bug"
```

## Constraints

- Parse `type(scope?): description`.
- Map `feat` -> Features, `fix` -> Bug Fixes, `chore` -> Chores, else Other.
- Omit empty sections.
