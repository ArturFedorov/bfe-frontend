# 055. Migration Order

**Difficulty:** Medium
**Topics:** Topological Sort, Heaps, Deterministic Ordering

---

## Description

Your database migration runner takes a map of migration ids to the migrations they
depend on, and must emit a **single, fully deterministic** run order — every engineer
and every CI machine must produce byte-identical output, or migration diffs become
unreviewable. The rule: a migration is *ready* once all of its dependencies have been
emitted; among all ready migrations, always emit the **alphabetically first** one
(default lexicographic string order). This tie-break makes the valid topological
order unique. If the migrations contain a dependency cycle, throw.

## Examples

```ts
migrationOrder({ b: [], a: [] });
// ['a', 'b']  (both ready — alphabetical wins)

migrationOrder({ a: ['z'], b: [], z: [] });
// ['b', 'z', 'a']  (NOT a global sort: 'a' is not ready until 'z' runs)

migrationOrder({ a: ['b'], b: ['a'] }); // throws (cycle)
```

## Constraints

- Input is `Record<string, string[]>`: each key depends on every id in its array; every id that appears in an array is also a key.
- Cycles are possible — **throw an `Error`** when one exists.
- Among ready migrations, always pick the lexicographically smallest id — the output order is therefore unique, and tests compare against it exactly.
- Note this is not a plain alphabetical sort of all ids: an id only competes once its dependencies are emitted.
- The result contains every key exactly once. Do not mutate the input graph.

## Target

O(V log V + E) — a min-heap (or sorted structure) over the ready set.

## Interviewer follow-up

Why does picking the alphabetically smallest ready node need a heap rather than sorting the ready array on every step — and what does each choice cost on a graph with one giant ready set?
