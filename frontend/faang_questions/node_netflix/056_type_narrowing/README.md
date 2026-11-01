# N56. Type narrowing exercises

**Difficulty:** Medium
**Topics:** TypeScript, Discriminated Unions, Type Guards

---

## Description

Practice narrowing with a discriminated union. Implement `area(shape)` using an
exhaustive `switch` on the `kind` discriminant, plus a custom type guard
`isCircle`.

## Examples

```ts
area({ kind: 'square', side: 2 }); // 4
isCircle({ kind: 'circle', radius: 1 }); // true
```

## Constraints

- The `switch` default branch must assign to `never` so an unhandled `kind` is a
  compile error (exhaustiveness).
- `isCircle` is a user-defined type guard (`shape is ...`).
