# N8. Lockfile Differ

**Difficulty:** Medium
**Topics:** Diffing, Data Modeling

---

## Description

Compare two `package-lock.json`-style maps and report which packages were added,
removed, or changed (with from/to versions).

## Examples

```ts
diffLockfiles({ a: '1.0.0', c: '3.0.0' }, { a: '1.0.0', d: '4.0.0' });
// { added: ['d'], removed: ['c'], changed: [] }
```

## Constraints

- `added`: present in `after` only. `removed`: present in `before` only.
- `changed`: present in both with a different version.
