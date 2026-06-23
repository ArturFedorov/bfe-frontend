# N52. Implement `DeepReadonly<T>`

**Difficulty:** Medium
**Topics:** TypeScript, Recursive Mapped Types

---

## Description

Recursively mark every property of `T` — and every nested object property —
`readonly`.

## Examples

```ts
type Config = { server: { host: string; port: number }; name: string };
type RO = DeepReadonly<Config>;
// { readonly server: { readonly host: string; readonly port: number }; readonly name: string }
```

## Constraints

- Recurse into nested object types.
- Primitives are left as-is (only their key becomes `readonly`).
