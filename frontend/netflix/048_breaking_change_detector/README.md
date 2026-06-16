# N48. Breaking Change Detector

**Difficulty:** Hard
**Topics:** API Diffing, Semver, Compatibility

---

## Description

Compare two versions of a package's public API (exported names + signatures) and
classify changes as removed / changed (breaking) or added (non-breaking).

## Examples

```ts
detectBreakingChanges({ a: '() => void' }, { b: '() => void' });
// { removed: ['a'], changed: [], added: ['b'] }
```

## Constraints

- `removed`: in `before` not `after`. `added`: in `after` not `before`.
- `changed`: present in both but the signature string differs.
