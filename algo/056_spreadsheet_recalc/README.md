# 056. Spreadsheet Recalculation Order

**Difficulty:** Hard
**Topics:** Topological Sort, Reverse Graph, Incremental Computation

---

## Description

You own the recalculation engine of a spreadsheet. Each formula cell maps to the
cells its formula reads from (its dependencies). When the user edits one cell, the
engine must not recompute the whole sheet — it must recompute **only the cells whose
values are actually affected**: the edited cell's transitive dependents. Return those
affected cells (the edited cell itself is excluded — its new value is the input) in a
valid recompute order: every affected cell appears after every affected cell its
formula reads from. If recomputation would run into a circular reference among the
affected cells, throw; a circular reference elsewhere in the sheet that the edit
never touches must not block the edit.

## Examples

```ts
// b reads a; c reads b; d reads c — and 'x' is unrelated
const sheet = { a: [], b: ['a'], c: ['b'], d: ['c'], x: [] };

recalcOrder(sheet, 'a'); // ['b', 'c', 'd']
recalcOrder(sheet, 'c'); // ['d']
recalcOrder(sheet, 'x'); // []  (nothing reads x)

recalcOrder({ a: ['b'], b: ['a'] }, 'a'); // throws (circular reference)
```

## Constraints

- Input is `Record<string, string[]>` mapping each cell to the cells its formula reads (its dependencies), plus the id of the changed cell; every id that appears in an array is also a key.
- Affected cells = all transitive **dependents** of the changed cell (walk the edges in reverse). The changed cell is never included in the result.
- Order requirement: for any two affected cells where one reads the other, the one being read comes first. Multiple valid orders may exist; any valid one is accepted, deterministically.
- Cycles are possible. **Throw an `Error`** only if a cycle involves the affected cells; an untouched cycle elsewhere in the sheet must not throw.
- An unknown changed-cell id, or a cell nothing reads, returns `[]`. Do not mutate the input graph.

## Target

O(V + E) — but only the affected subgraph should be topologically processed.

## Interviewer follow-up

How would a real spreadsheet report a circular reference to the user instead of throwing — and how could you support intentional iterative calculation (Excel's "enable iterative calc")?
