# N17. Dual Package Builder

**Difficulty:** Medium
**Topics:** Module Systems, CJS/ESM, Codegen

---

## Description

Given an ESM source file, output both ESM (unchanged) and a CommonJS equivalent
using `module.exports` / `exports.<name>`.

## Examples

```ts
buildDual('export const x = 1;');
// { esm: 'export const x = 1;', cjs: 'const x = 1; exports.x = x;' }
```

## Constraints

- Support `export const`, `export function`, and `export default`.
- `export default <expr>` maps to `module.exports = <expr>`.
