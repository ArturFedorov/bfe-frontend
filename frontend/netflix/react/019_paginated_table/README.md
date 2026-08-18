# 019. Paginated Table

**Difficulty:** Medium
**Topics:** Server Pagination, Race Conditions, Derived Request Params

---

## Scenario

The content-delivery dashboard lists tens of thousands of deliveries, so the
table is server-paginated: the UI asks the API for one page at a time. Ops
filter by delivery status constantly, and the current build has two famous
bugs — changing the filter while on page 7 shows an empty page (the page never
reset), and on a slow connection an older page's response overwrites a newer
one. Build the table that gets this right.

## Acceptance Criteria

- On mount, fetches page 1 with `{ page: 1, pageSize, status: 'all' }` via the
  injected `fetchPage` prop (never touch global fetch).
- While a page is loading, renders a `'Loading deliveries…'` placeholder row;
  it disappears when the response lands.
- Renders one table row per delivery (id, title, status) and a summary line
  `'Page X of Y · N deliveries'` computed from `total` and `pageSize`.
- `'Next page'` / `'Previous page'` buttons fetch with the right `page` param.
  Previous is disabled on page 1; Next is disabled on the last page.
- Changing the status filter (a labelled `<select>`) resets to page 1 and
  fetches with the new status.
- Stale responses are ignored: if a newer request was issued, an older
  response resolving later must NOT be rendered (assert with out-of-order
  deferred resolution).
- A11y: semantic `<table>`, the filter select has a visible `<label>`,
  pagination controls are real buttons with accessible names.

## Example

```tsx
<PaginatedTable
  pageSize={2}
  fetchPage={({ page, pageSize, status }) =>
    api.listDeliveries({ page, pageSize, status })}
/>
// filter to "failed" while on page 3 → refetches { page: 1, status: 'failed' }
```

## Target

25–35 minutes. Senior signals: one effect keyed on `(page, status)`, the
request-id (or closure flag) guard against out-of-order responses, and the
filter-resets-page rule handled in state, not in the effect.

## Interviewer follow-up

Product wants the previous page's rows to stay visible (dimmed) while the next
page loads, instead of a placeholder row. What state shape change does that
require, and how does it interact with your stale-response guard?
