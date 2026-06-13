# N31. ESLint Config Merger

**Difficulty:** Medium
**Topics:** Config, Merge Priority

---

## Description

Follow an ESLint `extends` chain and merge rules with correct priority: later
presets override earlier ones, and the config's own rules win over all presets.

## Examples

```ts
mergeConfig(presets, { extends: ['recommended'], rules: { 'no-x': 'off' } });
```

## Constraints

- Resolve `extends` recursively, in order.
- Per-rule last-wins; the config's own `rules` are applied last.
