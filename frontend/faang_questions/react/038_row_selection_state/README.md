# 038. Row Selection State

Difficulty: Medium

Topics: useReducer, Set state, indeterminate checkbox, pagination

## Scenario

The delivery-jobs table supports bulk actions (retry, cancel), so ops need
multi-select: per-row checkboxes, a header checkbox that selects or clears the
visible page, and a separate "select all N jobs" affordance for acting across
every page — the classic Gmail pattern. Selection must survive paging back and
forth, and the header checkbox must show the browser-native indeterminate state
when only some rows on the page are selected.

## Acceptance Criteria

- `selectionReducer` over `{ selectedIds: ReadonlySet<string> }` with actions:
  `toggleRow`, `togglePage` (given the visible page's ids), `selectAll` (given
  every id), `clearAll`. New `Set` instances on change — never mutate in place.
- `togglePage`: if every visible id is already selected, deselect *only* those
  ids; otherwise select them all. Ids selected on other pages are never affected.
- `selectAll` selects every id across all pages — this is the select-page vs
  select-all distinction.
- `getHeaderState(selectedIds, pageIds)` returns `'all' | 'some' | 'none'` for
  the visible page (empty page → `'none'`).
- `SelectableTable({ rows, pageSize })` renders the current page with a checkbox
  per row, the header checkbox (checked when `'all'`, `el.indeterminate` when
  `'some'`), Previous/Next paging buttons, a "Select all N" button, a Clear
  button, and a live "N selected" count.
- Selection survives page changes: check rows, page away, page back — still
  checked.

## Example

```ts
let s = initialSelectionState;
s = selectionReducer(s, { type: 'togglePage', pageIds: ['a', 'b'] }); // a, b selected
s = selectionReducer(s, { type: 'toggleRow', id: 'a' });              // only b
getHeaderState(s.selectedIds, ['a', 'b']); // 'some'
```

## Target

- Reducer pure and testable without React; component is thin wiring.
- Indeterminate set via a ref callback — it is a DOM property, not an attribute.
- ~90 lines.

## Interviewer follow-up

- Why must `indeterminate` be set imperatively instead of via JSX props?
- The table holds 100k rows — what breaks with a `Set` of ids, and when would you
  switch to "all selected except these" (inverted selection)?
- Rows can be deleted by another user while selected — where do you reconcile stale ids?
