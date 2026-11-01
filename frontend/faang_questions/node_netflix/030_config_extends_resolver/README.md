# N30. Config Extends Resolver

**Difficulty:** Medium
**Topics:** Deep Merge, Config, Recursion

---

## Description

Implement `tsconfig.json`-style `extends`: resolve the base chain and deep-merge,
with the extending config overriding its base.

## Examples

```ts
resolveConfig({ base: { a: 1 }, child: { extends: 'base', b: 2 } }, 'child');
// { a: 1, b: 2 }
```

## Constraints

- Deep-merge nested objects; child values win.
- Support `extends` as a single name or an array (later wins).
- Remove the `extends` key from the output.
