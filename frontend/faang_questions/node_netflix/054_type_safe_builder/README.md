# N54. Type-safe builder pattern

**Difficulty:** Medium
**Topics:** TypeScript, Generics, Fluent APIs

---

## Description

Build a fluent builder where each `set(key, value)` call chains and accumulates
the result type, and `build()` returns the assembled object with precise types.

## Examples

```ts
const result = new Builder()
  .set('name', 'ada')
  .set('age', 36)
  .build();
// result: { name: string; age: number }
```

## Constraints

- `set` returns a builder whose type tracks the new key (`T & Record<K, V>`).
- `build()` returns the accumulated object.
