# 016. Fluent Builder

**Difficulty:** Hard
**Topics:** Accumulating type state, fluent APIs, generics in return position

---

## Scenario

The reporting screen lets partners compose queries over their delivery data, and the
frontend assembles them with a builder. The old one is stringly typed: you can `.where()`
a column you never selected and find out from a 400. You're rebuilding it so the *type*
accumulates as the chain grows — after `.select('name')`, `.where()` only offers
`'name'`; before any `.select()`, `.where()` and `.build()` don't exist at all.

## Requirements

- Design the types for `createQuery<T>()` returning a fluent builder. Documented rule:
  `.where()` and `.build()` become available only after the first `.select()`, and
  `.where()` accepts only fields that have been selected so far.
- `.select(...fields)` — keys of `T`; repeat calls accumulate into the selected-field union.
- `.where(field, value)` — `field` must be a selected field; `value` must be `T[field]` for that exact field.
- `.build()` — returns `{ fields, filters }` typed by the accumulated selection (`Query<T, Selected>`).
- Runtime: `build()` returns the selected fields (in call order) and the recorded filters.

## Example

```ts
createQuery<PartnerRow>()
  .select('name', 'tier')
  .where('tier', 'preferred')   // ok — 'tier' was selected
  .build();                     // Query<PartnerRow, 'name' | 'tier'>

createQuery<PartnerRow>().select('name').where('active', true); // compile error
createQuery<PartnerRow>().build();                              // compile error
```

## Target

~35 min. Done = jest suite green: runtime tests pass **and** every inline type
assertion compiles (the compile errors are part of the test suite). The stub is
deliberately `any`-typed — designing the accumulating types is the task.

## Interviewer follow-up

- Two ways to gate `.build()`: a separate pre-select interface vs a conditional type on the method. Trade-offs at the error-message level?
- Your runtime is one mutable object behind ever-narrower types. Is that safe? When would you return fresh objects instead?
- How would you add `.orderBy()` restricted to selected fields *of sortable type* (string | number)?
