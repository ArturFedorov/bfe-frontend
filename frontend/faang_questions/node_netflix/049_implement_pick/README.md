# N49. Implement `Pick<T, K>`

**Difficulty:** Easy
**Topics:** TypeScript, Mapped Types

---

## Description

Rebuild the built-in `Pick<T, K>` utility from scratch using a mapped type.
`MyPick<T, K>` constructs a type by selecting the set of properties `K` from `T`.

## Examples

```ts
type User = { id: number; name: string; admin: boolean };
type Public = MyPick<User, 'id' | 'name'>; // { id: number; name: string }
```

## Constraints

- `K` must be constrained to `keyof T`.
- Preserve optionality / `readonly` modifiers of the picked keys.
