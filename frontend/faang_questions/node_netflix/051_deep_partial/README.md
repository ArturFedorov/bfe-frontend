# N51. Implement `DeepPartial<T>`

**Difficulty:** Medium
**Topics:** TypeScript, Recursive Mapped Types

---

## Description

Recursively make every property of `T` — and every nested object property —
optional.

## Examples

```ts
type Config = { server: { host: string; port: number }; debug: boolean };
type Partialed = DeepPartial<Config>;
// { server?: { host?: string; port?: number }; debug?: boolean }
```

## Constraints

- Recurse into nested object types.
- Primitives are left as-is (only their key becomes optional).
