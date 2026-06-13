# N24. API Deprecation Migrator

**Difficulty:** Medium
**Topics:** Codemods, Transforms

---

## Description

Find all calls to `oldApi(...)` and rewrite them to `newApi(...)` with a defined
argument transformation (here: swap the two arguments).

## Examples

```ts
migrateApi('oldApi(1, 2);');
// 'newApi(2, 1);'
```

## Constraints

- Transform every call; leave other code unchanged.
- Args are simple comma-separated tokens (no nested parens) for this exercise.
