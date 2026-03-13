# 14. Dynamic Table

**Difficulty:** Medium  
**Topics:** DOM manipulation, data binding, sorting algorithms, event handling

---

## Description

Build a dynamic table component that renders tabular data from an array of objects. The table supports adding rows, removing rows, retrieving data, and sorting by column.

## Requirements

- Render a `<table>` with header row from `columns` and data rows from `data`
- `addRow(row)` appends a new row to the table and updates internal data
- `removeRow(index)` removes the row at the given index
- `getData()` returns the current array of data objects
- `sort(column, direction)` sorts data by the specified column in `"asc"` or `"desc"` order and re-renders
- When `sortable` is `true`, clicking a column header sorts by that column
- `destroy()` removes all listeners and cleans up the DOM

## Examples

```ts
const container = document.getElementById('table')!;

const table = createTable({
  container,
  columns: ['name', 'age', 'city'],
  data: [
    { name: 'Alice', age: 30, city: 'NYC' },
    { name: 'Bob', age: 25, city: 'LA' },
  ],
  sortable: true,
});

table.addRow({ name: 'Charlie', age: 35, city: 'Chicago' });
table.sort('age', 'asc');
table.removeRow(0);
console.log(table.getData());
table.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Create the <code>&lt;table&gt;</code>, <code>&lt;thead&gt;</code>, and <code>&lt;tbody&gt;</code> elements. The header row should have one <code>&lt;th&gt;</code> per column. Each data row has one <code>&lt;td&gt;</code> per column.
</details>

<details>
<summary>Hint 2</summary>
Keep the data array as internal state. For <code>addRow</code>, push to the array and append a <code>&lt;tr&gt;</code>. For <code>removeRow</code>, splice the array and remove the corresponding row element.
</details>

<details>
<summary>Hint 3</summary>
For sorting, use <code>Array.prototype.sort</code> with a comparator that handles both strings and numbers. After sorting, clear <code>&lt;tbody&gt;</code> and re-render all rows.
</details>
