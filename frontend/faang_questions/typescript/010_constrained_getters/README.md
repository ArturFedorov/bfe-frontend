# 010. Constrained Getters

**Difficulty:** Easy
**Topics:** Generic constraints, `keyof`, indexed-access types

---

## Scenario

Every screen in the partner tools pulls one column out of a list — partner names for
a dropdown, integration states for a health strip, row counts for a chart. Instead of
`items.map(x => x.field)` with copy-pasted lambdas, you want one `getField(items, key)`
helper where a valid key infers the exact value type and an invalid key doesn't compile.

## Requirements

- Implement `getField<T, K extends keyof T>(items: readonly T[], key: K): T[K][]`.
- The element type of the result is the indexed-access type `T[K]` — literal unions survive
  (`tier` gives `('standard' | 'preferred')[]`, not `string[]`).
- Keys that don't exist on `T` are compile errors.
- The input array is not mutated.

## Example

```ts
const partners = [
  { id: 'p-1', name: 'Acme', tier: 'preferred' },
  { id: 'p-2', name: 'Globex', tier: 'standard' },
];

getField(partners, 'name'); // string[] — ['Acme', 'Globex']
getField(partners, 'tier'); // ('standard' | 'preferred')[]
getField(partners, 'nope'); // compile error
```

## Target

~10 min. Done = jest suite green: runtime tests pass **and** every inline type
assertion compiles (the compile errors are part of the test suite).

## Interviewer follow-up

- What happens to the return type if you drop the constraint and type `key: string`?
- Why does `T[K]` stay precise for literal-union properties where a manual conditional wouldn't be needed?
- How would the signature change for `getField(items, 'a.b')` dot-paths? (Teaser for task 024.)
