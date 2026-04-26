# 28. Data Table with Sort & Filter

**Difficulty:** Medium
**Topics:** Stable sort, derived state, ARIA `aria-sort`

---

## Description

Build a data table with sortable columns and a global text filter. Clicking a column header cycles through `none → asc → desc → none`. The filter input matches a substring against any string column. Sorting is stable (rows that compare equal keep their original order).

## Requirements

- Renders a `<table>` with `<thead>` (column headers) and `<tbody>` (rows)
- Clicking a sortable column header cycles its sort direction
- Header reflects state with `aria-sort="ascending" | "descending" | "none"`
- Filter input filters rows by substring (case-insensitive) across all string columns
- Sort is **stable** — equal rows retain insertion order
- `setData(rows)` replaces the dataset and re-renders
- `setFilter(text)` updates the filter
- `setSort({ column, direction })` programmatically sorts
- `getRows()` returns currently displayed rows (post sort + filter)
- `destroy()` removes elements and listeners

## Examples

```ts
const table = createDataTable({
  container: document.getElementById('table')!,
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', sortable: true },
  ],
  data: [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
  ],
});

table.setSort({ column: 'age', direction: 'asc' });
table.getRows()[0].name; // 'Bob'
```

## Approach Hints

<details>
<summary>Hint 1</summary>
<code>Array.prototype.sort</code> is stable in modern engines (ES2019+) but not in older ones. To guarantee stability, sort on a tuple of <code>(value, originalIndex)</code> and tie-break with the index.
</details>

<details>
<summary>Hint 2</summary>
Keep <code>data</code>, <code>filter</code>, and <code>sort</code> as separate state. Render = filter the data, then sort the result, then build rows. Don't mutate the original array.
</details>

<details>
<summary>Hint 3</summary>
For numeric columns, compare with <code>a - b</code>. For strings, use <code>String.prototype.localeCompare</code> — it handles unicode and case sensibly.
</details>
