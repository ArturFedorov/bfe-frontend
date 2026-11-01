# N60. Snapshot testing

**Difficulty:** Medium
**Topics:** Testing, Serialization

---

## Description

Implement `toMatchSnapshot`: serialize a value, store it on first run (keyed by
name), and on later runs compare against the stored snapshot. With `update` set,
overwrite the stored value instead of comparing.

## Examples

```ts
const store = {};
toMatchSnapshot(store, 'a', { x: 1 }); // { pass: true, stored: true }
toMatchSnapshot(store, 'a', { x: 1 }); // { pass: true, stored: false }
toMatchSnapshot(store, 'a', { x: 2 }); // { pass: false, ... }
```

## Constraints

- First run for a key writes the snapshot and passes.
- Later runs compare; a mismatch fails (unless `update: true`).
