# N50. Implement `Omit<T, K>`

**Difficulty:** Easy
**Topics:** TypeScript, Mapped Types, `Exclude`

---

## Description

Rebuild the built-in `Omit<T, K>` utility. Build it from `Pick` + `Exclude`:
keep every key of `T` that is not in `K`.

## Examples

```ts
type User = { id: number; name: string; admin: boolean };
type Safe = MyOmit<User, 'admin'>; // { id: number; name: string }
```

## Constraints

- Compose `Pick<T, Exclude<keyof T, K>>`.
- Unknown keys in `K` should be tolerated (`K extends keyof any`).
