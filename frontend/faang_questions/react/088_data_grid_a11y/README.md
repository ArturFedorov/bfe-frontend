# 088. Data Grid A11y

**Difficulty:** Very Hard
**Estimated time:** 60 min
**Topics:** `role="grid"`, Roving Tabindex, Sorting with `aria-sort`, Column Resize, Range Selection, Controlled Selection

---

## Scenario

QA analysts audit annotation batches in a grid: one row per labeled item with
the annotator, the model confidence, and the review status. They sort by
confidence to find the shaky rows, drag column edges to make long task names
readable, and select ranges of rows with Shift+click to bulk-reassign them.
The first version was a plain `<table>` with checkboxes: Tab stopped on every
cell (hundreds of tab stops), Shift+click selected rows by their *original*
index so sorting first produced a random selection, and paging dropped the
selection entirely. Build a grid that behaves like a spreadsheet for keyboard
users and keeps selection correct through sorting and paging.

The grid is **fully controlled** for selection: it receives `selection` (a
`Set` of row ids) and reports every change through `onSelectionChange(next)`.
Sort state, current page, column widths and the active cell are internal.

## Contract

```tsx
interface Column { key: string; header: string; sortable?: boolean; width?: number }
type Row = { id: string; [key: string]: string | number };

<DataGrid
  rows={rows}
  columns={columns}
  pageSize={10}                      // default 10
  selection={selectedIds}            // ReadonlySet<string>
  onSelectionChange={(next) => setSelectedIds(next)}
/>
```

Pure helpers (exported, unit-tested directly):

```ts
nextSortDirection(current): 'ascending' | 'descending' | 'none'
// none -> ascending -> descending -> none

sortRows(rows, sort: { key, direction } | null): Row[]
// stable; numbers compare numerically, strings with localeCompare;
// null / 'none' returns the original order

rangeBetween(orderedIds: string[], anchorId: string, targetId: string): string[]
// inclusive slice of orderedIds between the two ids, in either direction;
// [targetId] if the anchor is not in the list
```

### DOM shape (the tests query exactly this)

- `<table role="grid">`; header cells `role="columnheader"`; body rows
  `role="row"` with `aria-selected`; data cells `role="gridcell"`.
- Column 0 of every body row is a selection cell containing
  `<input type="checkbox" aria-label="Select row <id>">`.
- A sortable header contains a `button` whose name is the header text.
  The header carries `aria-sort="ascending" | "descending" | "none"`;
  non-sortable headers have no `aria-sort`.
- Each data column header contains a resize handle:
  `role="separator" aria-orientation="vertical" aria-label="Resize <header> column"
  aria-valuenow={width} aria-valuemin={40}`, `tabIndex={0}`. The header's
  `style.width` equals `aria-valuenow` in px. Default width 120.
- `<thead data-sticky="true">` (sticky positioning is CSS, not tested).
- Status: `role="status"` reads `N selected` (total across pages).
- Pager: buttons `Previous` / `Next` and text `Page X of Y`.

## Requirements

1. **Sorting.** Clicking a sortable header button cycles
   none → ascending → descending → none and sets `aria-sort`. Only one
   column is sorted at a time; the others read `none`. Numbers sort
   numerically, strings alphabetically, the sort is stable, and `none`
   restores the original order.
2. **Column resize.** `ArrowRight` / `ArrowLeft` on a handle change that
   column's width by ±10px (min 40). Pointer drag: `pointerdown` records the
   start, each `pointermove` sets `width = startWidth + (clientX - startX)`,
   `pointerup` ends the drag; moves after `pointerup` do nothing. Guard
   `setPointerCapture` — it does not exist in jsdom.
3. **Roving tabindex.** Exactly one `gridcell` has `tabIndex={0}`; all others
   `-1`. Initially row 0 / column 0 of the current page. Clicking a cell
   makes it active. Arrow keys move the active cell (clamped, no wrap);
   `Home` / `End` go to the first / last cell of the row; `PageDown` /
   `PageUp` change page and keep the same row position (clamped) and column.
   DOM focus follows the active cell after a keyboard move.
4. **Row selection.** `Space` while the active cell is a row's selection cell
   toggles that row and makes it the range anchor. Clicking the checkbox
   toggles the row and sets the anchor. Shift+click on a checkbox selects
   (adds) every row between the anchor and the clicked row **in the current
   sorted order** (across pages), keeping existing selections. With no anchor,
   Shift+click behaves like a plain click.
5. **Controlled.** The grid never stores selection. `onSelectionChange`
   receives a new `Set` each time; the checkboxes and `aria-selected` reflect
   only the `selection` prop. `N selected` counts the prop.
6. **Selection survives sorting and paging.** Because selection is keyed by
   id, sorting or paging never changes the selected set, and the status keeps
   the total.
7. **Paging.** `Previous` / `Next` buttons and `Page X of Y`. `Previous` is
   disabled on the first page, `Next` on the last.
8. **Active cell follows the row id.** After sorting, the active cell stays on
   the same row id (same column) if that row is still on the current page;
   otherwise it falls back to the first row of the page in the same column.
9. **No double toggle.** `Space` with DOM focus on the checkbox itself (after
   clicking it) toggles the row exactly once.

## Acceptance Criteria

- [ ] `nextSortDirection` cycles none → ascending → descending → none.
- [ ] `sortRows` sorts numbers numerically, strings alphabetically, is
      stable, and returns the original order for `null`.
- [ ] `rangeBetween` is inclusive, works in both directions, and returns
      `[target]` when the anchor is missing.
- [ ] Sort button cycles `aria-sort`; rows re-order; other sortable headers
      read `none`; non-sortable headers have no `aria-sort`.
- [ ] Resize handle: `ArrowRight` → 130, `ArrowLeft` ×2 → 110, never below 40;
      header `style.width` tracks `aria-valuenow`.
- [ ] Pointer drag of +50px → width 170; moves after `pointerup` are ignored.
- [ ] Exactly one tabbable gridcell; arrows / Home / End move it and focus;
      edges clamp.
- [ ] `PageDown` / `PageUp` change the page and keep the row position.
- [ ] Checkbox click → `onSelectionChange(new Set([...prev, id]))`; again → removed.
- [ ] `Space` on the selection cell toggles the row.
- [ ] Shift+click selects the inclusive range and keeps prior selections.
- [ ] Controlled: without a parent update the checkbox stays unchecked;
      `aria-selected` and `N selected` follow the prop.
- [ ] Selection survives `Next` / `Previous` and sorting.
- [ ] Senior: after sorting by Confidence ascending, click row `r3` then
      Shift+click row `r5`: the selection is the rows *displayed* between them,
      not ids `r3..r5`.
- [ ] Senior: with the active cell on row `r2`'s Task column, sorting by
      Confidence keeps the tabbable cell on `r2`'s row and the Task column;
      sorting a row off the page falls back to the first row, same column.
- [ ] `Space` with focus on the checkbox itself toggles exactly once.

## Baseline a11y

- `role="grid"` with `columnheader` / `row` / `gridcell`; `aria-sort` on
  sortable headers; `aria-selected` on rows.
- Exactly one tabbable cell (roving tabindex), checkboxes `tabIndex={-1}`
  and named `Select row <id>`.
- Resize handles are focusable separators with `aria-valuenow` / `aria-valuemin`.
- Selection count in a `role="status"` region.

## Constraints

- React only; no table or grid libraries.
- Do not copy `selection` into state. Do not store the active cell as a row
  index — store the row id.
- Key handling lives on the grid body, not `window`; ignore keys whose target
  is an `input` so the checkbox's own Space does not double-fire.

## Interviewer follow-ups (talk-through only)

- The grid will hold 50k rows. Virtualizing rows breaks "exactly one tabbable
  cell" when the active row scrolls out of the DOM. Which pattern survives —
  roving tabindex with a focus-restoring effect, or `aria-activedescendant`
  on the grid — and what changes in the keyboard handler?
- Shift+click ranges across pages select rows the user cannot see. Is that
  what Gmail does? Argue for and against clamping the range to the page.
- The server can sort too. When would you move sorting server-side, and how
  does the active-cell-by-row-id rule behave when the page's rows are
  replaced asynchronously?
- Column widths should persist per user. Where do they live (URL, local
  storage, server profile) and how do you reconcile a saved width for a
  column that no longer exists?

## Say out loud

- State shape first: `sort: { key; direction } | null`, `page: number`,
  `widths: Record<string, number>`, `active: { rowId: string | null; col: number }`,
  `anchorId: string | null`; `selection` comes from props.
- Name the hazard: the active cell and the range anchor are positions in a
  *derived* order — store ids, derive indices every render, and clamp when
  the row is gone.
- Ask one data-shape question: can a cell be `null` / missing, and how should
  missing values sort (first, last, stable)?
- Ask one failure-handling question: if the parent rejects a selection
  change (e.g. a row became read-only), should the grid revert the anchor?
- Name the first test you would write: "Shift+click after sorting selects
  the displayed range, not the original ids".
