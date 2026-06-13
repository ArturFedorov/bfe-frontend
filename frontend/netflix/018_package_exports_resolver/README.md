# N18. `package.json` exports Resolver

**Difficulty:** Hard
**Topics:** Module Resolution, Conditional Exports

---

## Description

Implement conditional `exports` resolution: match a subpath (`.`, `./sub`) and
pick the target for the active conditions (`import`/`require`/`node`/`browser`),
falling back to `default`.

## Examples

```ts
resolveExports({ '.': { import: './a.mjs', require: './a.cjs' } }, '.', ['import']);
// './a.mjs'
```

## Constraints

- Conditions are matched in the order the keys appear; `default` is the fallback.
- Return `null` when no subpath/condition matches.
