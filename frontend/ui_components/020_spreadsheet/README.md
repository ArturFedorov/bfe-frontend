# 20. Spreadsheet

**Difficulty:** Hard  
**Topics:** DOM manipulation, parsing, formula evaluation, cell references, graph traversal

---

## Description

Build a basic spreadsheet grid component that supports cell values and simple formulas. Cells can contain plain text/numbers or formulas that reference other cells. Formulas start with `=` and support basic operations like `=A1+B1` and `=SUM(A1:A3)`.

## Requirements

- Render a grid of editable cells with `rows` rows and `cols` columns
- Column headers use letters (A, B, C, ...) and row headers use numbers (1, 2, 3, ...)
- `setCell(row, col, value)` sets a cell's raw value (0-indexed row and col)
- `getCell(row, col)` returns the raw value string stored in a cell
- `getCellDisplay(row, col)` returns the evaluated/display value of a cell
- Support `=SUM(A1:A3)` formula to sum a range of cells
- Support `=A1+B1` style cell reference arithmetic
- Handle circular references gracefully (return an error string like `#REF!`)
- `destroy()` removes all listeners and cleans up the DOM

## Examples

```ts
const container = document.getElementById('sheet')!;

const sheet = createSpreadsheet({
  container,
  rows: 5,
  cols: 5,
});

sheet.setCell(0, 0, '10');       // A1 = 10
sheet.setCell(1, 0, '20');       // A2 = 20
sheet.setCell(2, 0, '=A1+A2');   // A3 = formula
console.log(sheet.getCellDisplay(2, 0)); // "30"

sheet.setCell(3, 0, '=SUM(A1:A3)');
console.log(sheet.getCellDisplay(3, 0)); // "60"

sheet.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Store raw cell values in a 2D array. When <code>getCellDisplay</code> is called, check if the value starts with <code>=</code>. If so, parse and evaluate the formula; otherwise return the raw value.
</details>

<details>
<summary>Hint 2</summary>
Convert column letters to indices (A=0, B=1, etc.) and parse cell references like <code>A1</code> into <code>(row=0, col=0)</code>. For ranges like <code>A1:A3</code>, iterate from the start to end cell.
</details>

<details>
<summary>Hint 3</summary>
To detect circular references, maintain a set of cells currently being evaluated. If you encounter a cell that's already in the set, return <code>#REF!</code> instead of recursing infinitely.
</details>
