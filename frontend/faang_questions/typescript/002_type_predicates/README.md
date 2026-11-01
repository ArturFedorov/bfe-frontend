# 002. Type Predicates

**Difficulty:** Easy
**Topics:** Type Predicates, Narrowing, Array Filtering

---

## Scenario

The partner-tools account service returns a mixed list of accounts — external
partners and internal Netflix teams share one endpoint. The dashboard only renders
partners, and a report pipeline needs to drop `null`/`undefined` holes from a list
of contact names. Plain `filter` callbacks return `boolean` and keep the wide
element type; write predicates so the filtered arrays are correctly typed.

## Requirements

- `isPartner(account: Account): account is Partner` — a type predicate, not a
  plain `boolean` function, so `accounts.filter(isPartner)` has type `Partner[]`.
- `isPresent<T>(value: T | null | undefined): value is T` — a generic predicate,
  so `names.filter(isPresent)` has type `string[]` (and `.filter(Boolean)`
  demonstrably does not narrow).
- `selectPartners(accounts: Account[]): Partner[]` — implemented with
  `filter(isPartner)`, no casts.
- Runtime behavior must match the predicate: `isPartner` keys off the `kind`
  discriminant; `isPresent` rejects exactly `null` and `undefined` (keeps `''`,
  `0`, `false`).

## Example

```ts
const accounts: Account[] = [
  { kind: 'partner', id: 'p-1', name: 'Dolby', tier: 'strategic' },
  { kind: 'internal', id: 't-9', teamName: 'Encoding' },
];

const partners = accounts.filter(isPartner);
// partners: Partner[] — partners[0].tier compiles

const names = ['Ana', null, 'Bo', undefined].filter(isPresent);
// names: string[]
```

## Target

`filter` with these predicates must produce narrowed array types (`Partner[]`,
`string[]`), verified by `Equal` assertions on the results.

## Interviewer follow-up

`accounts.filter((a) => a.kind === 'partner')` runs the same check at runtime —
why doesn't TypeScript narrow it, and what changed in TS 5.5 for inferred
predicates?
