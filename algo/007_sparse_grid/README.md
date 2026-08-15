# 007. Sparse Spreadsheet Grid

**Difficulty:** Medium
**Topics:** Hash Maps, Sparse Data, Sorting, Data Structure Design

---

## Description

A spreadsheet engine must address cells by `(row, col)` where either coordinate
can be up to a billion — allocating a dense 2D array is out of the question.
Implement `SparseGrid<T>` backed by a map so that memory is proportional to the
number of **non-empty** cells only. `set` writes a cell (overwriting any
previous value), `get` reads one (`undefined` for an empty cell), `delete`
clears one, `size` counts non-empty cells, and `cells()` returns every
non-empty cell in row-major order (by row ascending, then column ascending) —
the order a renderer paints them.

## Examples

```ts
const grid = new SparseGrid<string>();
grid.set(5, 2, 'total');
grid.set(0, 999_999_999, 'far right');
grid.set(5, 0, 'label');
grid.get(5, 2);      // 'total'
grid.get(3, 3);      // undefined
grid.size();         // 3
grid.cells();
// [
//   { row: 0, col: 999999999, value: 'far right' },
//   { row: 5, col: 0, value: 'label' },
//   { row: 5, col: 2, value: 'total' },
// ]
grid.delete(5, 2);   // true
grid.delete(5, 2);   // false — already empty
grid.size();         // 2
```

## Constraints

- `row` and `col` must be non-negative integers (up to `10 ** 9`); all methods taking coordinates throw `RangeError` otherwise.
- `set` on an existing cell overwrites the value without changing `size()`.
- `delete` returns `true` if the cell was non-empty, `false` otherwise.
- `cells()` returns a fresh array each call; mutating it must not affect the grid.
- Stored values may be anything, including values that are `undefined`-like such as empty strings — a cell exists iff it was `set` and not deleted.
- Beware naive composite keys: `'1' + '23'` and `'12' + '3'` must not collide.

## Target

O(1) average `set`/`get`/`delete`/`size`; memory O(non-empty cells) — a dense
2D array will fail the large-input test (100k cells with coordinates up to
10^9). `cells()` may be O(n log n).

## Interviewer follow-up

If rows and columns could be any 32-bit integers (negatives included), compare
a string key like `` `${row},${col}` `` with a numeric key like
`row * 2 ** 32 + col` — where does each one break or get slow?
