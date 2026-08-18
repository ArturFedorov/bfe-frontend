# 009. Typed Pick

**Difficulty:** Easy
**Topics:** Generics, `keyof` constraints, `Pick`, inference

---

## Scenario

The partner dashboard sends partner records to a third-party analytics vendor, but
contracts say only whitelisted fields may leave the building. You need a runtime
`pick(obj, keys)` helper whose return type is *exactly* `Pick<T, K>` — so downstream
code knows precisely which fields survived, and a typo'd key never compiles.

## Requirements

- Implement `pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K>`.
- The result contains only the requested keys — no leftovers at runtime.
- The return type is exactly `Pick<T, K>`, inferred from the call site (no annotations needed by callers).
- Keys not present on `T` are rejected at compile time.
- An empty key list returns `{}`.

## Example

```ts
const partner = { id: 'p-1', name: 'Acme', tier: 'preferred', active: true };

pick(partner, ['id', 'name']); // { id: 'p-1', name: 'Acme' } — typed Pick<Partner, 'id' | 'name'>
pick(partner, ['id', 'nope']); // compile error
```

## Target

~10 min. Done = jest suite green: runtime tests pass **and** every inline type
assertion compiles (the compile errors are part of the test suite).

## Interviewer follow-up

- Why `K extends keyof T` on the function rather than `keys: (keyof T)[]`? What inference do you lose with the latter?
- What does `Pick<T, K>` give you over `Partial<T>` as the return type?
- How would you type an `omit(obj, keys)` counterpart, and why is its runtime check different?
