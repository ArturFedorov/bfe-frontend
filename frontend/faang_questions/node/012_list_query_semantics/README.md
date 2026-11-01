# 012. List Query Semantics

**Difficulty:** Medium
**Topics:** REST, Filtering, Sorting, Cursor Pagination, Keyset

---

## Scenario

Partners poll `GET /deliveries` to reconcile what we shipped them. Their
dashboards filter by status, sort by several fields, and page through tens of
thousands of rows — while new deliveries keep getting inserted. Offset
pagination would skip or duplicate rows the moment an insert lands between
two page fetches; you are building keyset (cursor) pagination that does not.

A `Delivery` is
`{ id: string; partnerId: string; status: 'pending' | 'delivered' | 'failed'; createdAt: number }`.

## Requirements

`createDeliveriesHandler(store)` returns a `Handler` for `GET /deliveries`
(anything else → **404** `{ error: 'Not Found' }`). Query parameters:

- **Filtering:** `partnerId` and `status` are exact-match filters and
  combine with AND.
- **Sorting:** `sort` is a comma list of `field` or `field:asc|desc`
  (default direction `asc`), e.g. `sort=status:asc,createdAt:desc`.
  Sortable fields: `createdAt`, `status`, `partnerId`, `id`. Default sort is
  `createdAt:asc`. `id` ascending is ALWAYS the implicit final tiebreaker, so
  the total order is unambiguous.
- **Pagination:** `limit` (positive integer, default `10`) and `cursor`
  (opaque string from a previous response).
- **200** body: `{ items: Delivery[], nextCursor: string | null }` —
  `nextCursor` is `null` exactly when nothing follows the page (a full final
  page still gets `null`, which costs you a look-ahead).
- **400** with body `{ error: <message> }` for:
  - unknown sort field → `Unknown sort field: <field>`
  - non-positive-integer `limit` → `Invalid limit`
  - undecodable/garbage cursor → `Invalid cursor`
  - a cursor issued under a different sort → `Cursor does not match sort`
  - any query parameter outside the five above → `Unknown query parameter: <name>`

### Cursor design (implement exactly this)

The cursor is **keyset-based**, not an offset: base64url-encoded JSON
`{ s, k }` where `s` is the normalized sort spec (`'createdAt:asc'`) and `k`
is the array of the last returned item's sort-field values plus its `id`
(e.g. `[1700000300, 'd3']`). A page-2 request returns items whose composite
key is strictly *after* `k` in the requested ordering.

Why this survives concurrent inserts: the cursor names a *position in the
ordering*, not a row count. Items inserted before that position are simply
never revisited (no duplicates of what the client already has); items
inserted after it appear exactly once on a later page (no skips). Offset
cursors can guarantee neither. Filters are re-applied per request, and `s`
is embedded so a client cannot replay a cursor against a different ordering.

## Example

```ts
const res = handle({ method: 'GET', path: '/deliveries', headers: {},
  query: { status: 'pending', sort: 'createdAt:desc', limit: '2' } });
// { status: 200, body: { items: [d9, d4], nextCursor: 'eyJzIjo...' } }
```

## Target

- One pass over the store per request is fine; no cursor state on the server.
- ~60 minutes.

## Interviewer follow-up

- What breaks if a sortable field is mutable (e.g. `status` changes between
  page fetches), and how do real APIs cope?
- The cursor is client-visible base64 — when would you sign or encrypt it?
- How does this map onto a SQL `WHERE (a, id) > ($1, $2) ORDER BY a, id
  LIMIT n`, and what index does it need?
