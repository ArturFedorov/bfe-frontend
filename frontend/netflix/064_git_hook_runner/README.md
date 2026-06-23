# N64. Git hook runner

**Difficulty:** Medium
**Topics:** Tooling, Pattern Matching, Pre-commit

---

## Description

Implement a pre-commit hook runner. Given the staged files and a set of hooks
(each with a pattern and a command), run only the hooks whose pattern matches at
least one staged file, passing the matching files. Report which hooks ran and
which failed.

## Examples

```ts
runHooks(['a.ts', 'README.md'], [
  { name: 'eslint', pattern: /\.ts$/, run: (files) => true },
]);
// { ran: ['eslint'], failed: [], ok: true }
```

## Constraints

- A hook runs only if at least one staged file matches its `pattern`.
- The hook receives only the matching files; `ok` is false if any hook fails.
