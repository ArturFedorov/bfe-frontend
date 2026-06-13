# N20. Dead Export Finder

**Difficulty:** Medium
**Topics:** Parsing, Static Analysis

---

## Description

Find named exports that are never imported by any file in the project.

## Examples

```ts
findDeadExports([
  { path: 'a.ts', code: 'export const dead = 2;' },
]);
// [{ file: 'a.ts', name: 'dead' }]
```

## Constraints

- Match named exports against named imports across all files.
- Regex is acceptable for the exercise; mention AST as the robust approach.
