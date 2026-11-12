# 101. Campaign Approval Grid

**Difficulty:** Hard
**Estimated time:** 60 min
**Topics:** URL-synced filters (History API, `popstate`), server paging, request counter for stale responses, selection keyed by id across pages, indeterminate header checkbox via ref callback, optimistic bulk action with rollback, `role="grid"`

---

## Scenario

Marketing managers approve campaigns before they go live. The approval queue
is server-paged and filterable (`all` / `pending` / `approved`), sortable by
name or last update, and managers paste links to a specific page into Slack.
The first grid kept filters in `useState` (links lost the view, Back left the
page), applied the *first* response that arrived rather than the latest one
(switching sort twice showed the wrong order), and "Approve selected" waited
for the server, so bulk approvals felt frozen; when the server rejected, the
rows had already been forgotten.

Build `<ApprovalGrid>`: URL-synced filters, a server-paged `role="grid"` with
selection that survives paging and sorting, and an optimistic bulk approve
that rolls back on failure — correct even when a page fetch and an approval
are in flight at the same time.

## Contract

```ts
type Campaign = { id: string; name: string; status: 'pending' | 'approved'; updatedAt: string };
interface ApprovalApi {
  list(params: { page: number; pageSize: number; status: 'all' | 'pending' | 'approved'; sort: 'name' | 'updatedAt' }):
    Promise<{ rows: Campaign[]; total: number }>;
  approve(ids: string[]): Promise<void>;
}

<ApprovalGrid api={api} pageSize={10} />   // pageSize default 10

// pure helpers (exported, unit-tested)
parseGridParams(search: string): { page: number; status: StatusFilter; sort: SortKey }
serializeGridParams(params): string       // '' or '?page=2&status=pending&sort=updatedAt'
```

### DOM shape (the tests query exactly this)

- Filters: `<select aria-label="Status">` with options `all` / `pending` /
  `approved`; `<select aria-label="Sort">` with option values `name` /
  `updatedAt` (labels `Name` / `Updated`).
- `<table role="grid" aria-label="Campaign approvals" aria-busy="true|false">`.
  Header row: a checkbox `aria-label="Select page"`, then column headers
  `Name`, `Status`, `Updated`.
- Body rows `role="row"` with `aria-selected`; column 0 holds
  `<input type="checkbox" aria-label="Select <name>">`; then name, status,
  `updatedAt` (first 10 chars).
- While a page fetch is pending the body is a single row whose cell reads
  `Loading…`. An empty page reads `No campaigns`.
- `role="status"` reads `N selected`.
- Button `Approve selected` (disabled when nothing is selected or an approval
  is in flight). Errors render in `role="alert"` with the error message.
- Pager: `Previous` / `Next` buttons and `Page X of Y` (`Y = max(1, ceil(total / pageSize))`).

## Requirements

1. **URL is the source of filter state.** On mount, parse `window.location.search`
   for `page` (default 1), `status` (default `all`) and `sort` (default
   `name`). Invalid values fall back to the defaults. The hook never rewrites
   the URL on mount.
2. **Changes push history.** Changing status or sort (resets `page` to 1) or
   paging calls `history.pushState` with the serialized params; default
   values are omitted, all-default is an empty search; pathname and hash are
   preserved. `popstate` re-parses the URL into state (Back works).
3. **Server paging.** Every change of `page` / `status` / `sort` calls
   `api.list` once with `{ page, pageSize, status, sort }`. While pending the
   grid is `aria-busy="true"` and shows the `Loading…` row; the response
   fills rows and `Page X of Y`.
4. **Stale responses are ignored.** Keep a request counter; only the latest
   request's response may update rows/total (an older response that resolves
   later is dropped).
5. **Selection keyed by id.** Row checkboxes toggle ids in a `Set`. The header
   `Select page` checkbox is checked when every visible row is selected,
   `indeterminate` (set via a ref callback) when some are, and toggles all
   visible rows. Selection survives paging and sorting; `N selected` counts
   the whole set.
6. **Optimistic approve.** `Approve selected` immediately hides the selected
   rows that are on the current page, then calls `api.approve(ids)` **once**
   with all selected ids. On success: the ids leave the selection and the
   current page is re-requested (`list` called again with the same params);
   the approved rows stay hidden until that response arrives. On failure: the
   hidden rows return, the selection is kept, and `role="alert"` shows
   `error.message`.
7. **Approve vs. fetch in flight.** Hidden ids are applied to whatever rows
   are current: if a page response arrives while an approval is pending and
   contains an id being approved, that row stays hidden; if that approval then
   fails, the row returns. A list response never clears in-flight approvals.

## Acceptance Criteria

- [ ] `parseGridParams('')` → defaults; valid values parse; `page=abc`,
      `page=0`, `status=bogus`, `sort=bogus` fall back.
- [ ] `serializeGridParams` omits defaults, returns `''` for all-default,
      round-trips through `parseGridParams`.
- [ ] Mount: `list` called once with `{ page: 1, pageSize: 10, status: 'all', sort: 'name' }`;
      `Loading…` row and `aria-busy="true"`; after resolve rows render with
      `Select <name>` checkboxes, `aria-busy="false"`, `Page 1 of 3`.
- [ ] `?page=2&status=pending&sort=updatedAt` → `list` called with those; the
      selects show `pending` / `updatedAt`; no `pushState` on mount.
- [ ] Status change → `pushState` once, URL `?status=pending`, page reset to 1,
      `list` called with page 1.
- [ ] Sort change → `?sort=updatedAt`; `Next` → `?page=2`; Previous back to
      page 1 → clean URL.
- [ ] Back (popstate) restores the previous filters and refetches.
- [ ] Clicking a row checkbox selects it; `aria-selected`; `1 selected`.
- [ ] `Select page` is indeterminate with a partial selection, checked when all
      visible rows are selected, selects/deselects the page.
- [ ] Selection survives Next/Previous and a sort change.
- [ ] Approve: selected rows vanish immediately; `approve` called once with
      the ids; on resolve `0 selected`, `list` re-requested, new rows shown.
- [ ] Approve rejection: rows return, `role="alert"` shows the message,
      selection intact, button enabled again.
- [ ] Senior: two rapid page changes — the earlier response resolving *after*
      the later one is ignored.
- [ ] Senior: approve pending + sort change; the sort response containing the
      approving id keeps it hidden; rejecting the approval brings it back.

## Baseline a11y

- `role="grid"` with `columnheader` / `row` / `gridcell`; `aria-selected` on
  rows; `aria-busy` while loading.
- Every checkbox has an accessible name; the selects have `aria-label`s.
- Selection count in `role="status"`, failures in `role="alert"`.

## Constraints

- React only; no router, table or query library.
- Keep selection as `Set<string>` keyed by id; never by row index.
- Use a request counter (ref) for staleness; cancellation via `AbortController`
  is not available on this API.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- The approve endpoint becomes partial-success (`{ approved: string[]; failed: string[] }`).
  How do rollback and the alert change?
- Replace the request counter with `AbortController` — what does the API
  contract need, and what still has to be guarded in the component?
- Selection across 50 pages is kept client-side. When should it become a
  server-side "select all matching filter" operation, and how does the UI
  represent "all 1,240 selected" vs. "the 10 on this page"?
- Should `pushState` happen for paging, or only for filters? Argue from Back
  button expectations.

## Say out loud

- State shape first: `params: { page; status; sort }` (mirrors the URL),
  `rows`, `total`, `loading`, `selection: Set<id>`, `hidden: Set<id>`,
  `approving: boolean`, `error: string | null`, `reqId` ref, `inFlightIds` ref.
- Name the hazard: two async sources (list and approve) write overlapping
  state — hidden rows must be derived from in-flight approvals, not cleared by
  whichever promise settles first.
- Ask one data-shape question: is `total` the count after the status filter,
  and does approving under `status=pending` shrink it?
- Ask one failure-handling question: on approve failure, is it all-or-nothing
  or partial, and should we refetch to learn the truth?
- Name the first test you would write: "a stale page response resolving after
  a newer one does not replace the rows".
