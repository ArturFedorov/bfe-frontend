# N7. Dependency Version Resolver

**Difficulty:** Hard
**Topics:** Semver, Resolution, npm install

---

## Description

Given a registry of available versions per package and a set of semver-range
requirements, resolve each requirement to the highest available version that
satisfies it. This is a simplified `npm install`.

## Examples

```ts
resolve(
  { react: ['16.0.0', '17.0.2', '18.0.0'] },
  { react: '^17.0.0' },
);
// { react: '17.0.2' }
```

## Constraints

- Choose the **highest** satisfying version.
- Throw if a requirement cannot be satisfied.
- You'll likely reuse your `satisfies()` / `compare()` work from N2/N3.
