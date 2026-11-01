# 016. ETag Caching

**Difficulty:** Medium
**Topics:** REST, HTTP Caching, Conditional Requests, Optimistic Concurrency

---

## Scenario

Partner dashboards poll the title catalog every few seconds, and 99% of the
time nothing changed — so stop re-sending the payload. The same mechanism
solves a nastier problem on the write path: two catalog editors load the same
entry, both hit save, and the slower one silently wipes out the faster one's
work. ETags give you both: `If-None-Match` for cheap reads, `If-Match` for
lost-update protection.

A `CatalogItem` is `{ id: string; title: string; genre: string }`.

## Requirements

- `computeEtag(value)` (exported) returns a **strong** ETag: the SHA-256 hex
  of the canonical JSON representation (object keys sorted recursively),
  wrapped in double quotes — `'"a3f0…"'`. Same representation → same tag,
  any field change → different tag.
- `createCatalogHandler(store)` returns a `Handler` over the injected
  `Map<string, CatalogItem>`:
- **GET `/catalog/:id`**
  - unknown id → **404** `{ error: 'Not Found' }`;
  - otherwise compute the ETag of the current item. If the `If-None-Match`
    header (case-insensitive, a comma-separated list of tags or `*`)
    contains the current tag or `*` → **304** with an `ETag` header and NO
    body;
  - no match / no header → **200**, `ETag` header, item as body.
  - Comparison is **strong**: a weak tag (`W/"…"`) never matches.
- **PUT `/catalog/:id`**
  - unknown id → **404** (this API does not create via PUT);
  - body must be an object → otherwise **400** `{ error: 'Invalid body' }`;
  - **missing `If-Match` → 428** `{ error: 'Precondition Required' }`. This
    is the documented policy: unconditional writes are how lost updates
    happen, so the API refuses them outright rather than defaulting to
    last-writer-wins;
  - `If-Match` present but no listed tag equals the CURRENT item's ETag
    (`*` matches any existing item) → **412** `{ error: 'Precondition Failed' }`,
    store untouched;
  - tag matches → replace the item (id preserved from the path), **200**
    with the NEW ETag header and the updated item as body.
- Any other method/path → **404** `{ error: 'Not Found' }`.

## Example

```ts
const g1 = await handle(get('/catalog/tt1'));            // 200, ETag '"ab12…"'
await handle(get('/catalog/tt1', { 'If-None-Match': g1.headers!.ETag }));
// 304, no body — the dashboard saves the transfer

// editor A and B both hold g1's tag:
await handle(put('/catalog/tt1', { ...bodyA }, g1.headers!.ETag)); // 200, new tag
await handle(put('/catalog/tt1', { ...bodyB }, g1.headers!.ETag)); // 412 — B must re-read
```

## Target

- ETag derives purely from the representation — no version counters to keep
  in sync.
- ~45 minutes.

## Interviewer follow-up

- Hash-based vs version-counter ETags: cost, collision, and multi-node
  consistency trade-offs?
- When are weak ETags (`W/`) the right tool, and why must they never guard
  writes?
- How would you combine this with `Cache-Control`/`Last-Modified`, and what
  does a CDN in front change?
