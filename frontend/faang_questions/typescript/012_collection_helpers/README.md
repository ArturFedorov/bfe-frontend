# 012. Collection Helpers

**Difficulty:** Medium
**Topics:** Generic inference, `Record`, `PropertyKey` constraints

---

## Scenario

The integrations health page slices the same list five different ways: integrations by
region, by state, latest run indexed by id. Everyone keeps hand-rolling `reduce` with an
`any` accumulator. You're writing `groupBy` and `indexBy` once, properly: when the key
callback returns a literal union, the result is a `Record` keyed by exactly that union.

## Requirements

- Implement `groupBy<T, K extends PropertyKey>(items, keyOf: (item: T) => K): Record<K, T[]>`.
- Implement `indexBy<T, K extends PropertyKey>(items, keyOf: (item: T) => K): Record<K, T>`.
- Key-union inference: `groupBy(integrations, i => i.region)` where `region` is
  `'emea' | 'apac' | 'amer'` yields `Record<'emea' | 'apac' | 'amer', Integration[]>`.
- `groupBy` preserves item order within each group; `indexBy` is last-write-wins on duplicate keys.
- A key callback returning something that isn't a valid object key must not compile.

## Example

```ts
groupBy(integrations, (i) => i.region);
// Record<'emea' | 'apac' | 'amer', Integration[]>

indexBy(integrations, (i) => i.id);
// Record<string, Integration>
```

## Target

~20 min. Done = jest suite green: runtime tests pass **and** every inline type
assertion compiles (the compile errors are part of the test suite).

## Interviewer follow-up

- `Record<'emea' | 'apac' | 'amer', T[]>` claims every region key exists — but at runtime a region may be absent. Is `Partial<Record<K, T[]>>` more honest? What does it cost callers?
- Why constrain `K extends PropertyKey` rather than `string`?
- How does this compare to `Object.groupBy` / `Map.groupBy`, and what do their lib types do about the completeness problem?
