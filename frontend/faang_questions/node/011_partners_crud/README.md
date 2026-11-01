# 011. Partners CRUD

**Difficulty:** Medium
**Topics:** REST, CRUD Semantics, Status Codes, In-Memory Store

---

## Scenario

Partner onboarding needs a `/partners` resource that external tooling can
script against. Scripts retry, partners get created twice, PATCH and PUT get
confused — so the exact status-code contract matters more than the happy
path. Listing/filtering is out of scope here (that is task 012); this task is
about getting every mutation's semantics precisely right.

A `Partner` is `{ id: string; name: string; email: string; tier: 'standard' | 'premium' }`.
`email` is the business key: two partners can never share one.

## Requirements

`createPartnersHandler(store, nextId)` returns a `Handler` covering:

- **POST `/partners`** — body must be an object with `name` (non-empty
  string), `email` (string containing `@`), and optional `tier`
  (`'standard' | 'premium'`, defaults to `'standard'`).
  - Validation failure → **400**, body `{ error: 'Validation failed', fields: string[] }`
    listing every bad/missing field name (in field order `name`, `email`,
    `tier`, `id`).
  - `email` already used by another partner → **409**, body
    `{ error: 'Email already exists' }`.
  - Success → **201** with a `Location` header of `/partners/{id}` (id comes
    from the injected `nextId()`), body = the created partner.
- **GET `/partners/:id`** — **200** with the partner, or **404** with body
  `{ error: 'Partner not found' }`.
- **PUT `/partners/:id`** — full replacement, and strict about it: `name`,
  `email`, AND `tier` are all required (400 listing the missing/invalid field
  names otherwise — no defaulting on PUT). Changing `email` to one owned by a
  *different* partner → **409**; keeping your own email is fine. Success →
  **200** with the replaced partner (same `id`).
- **PATCH `/partners/:id`** — partial merge: only provided fields are
  validated and applied; fields absent from the body are preserved. An empty
  patch `{}` is a valid no-op returning **200** with the unchanged partner.
  Unknown fields in the patch → **400** listing them in `fields`. Email
  uniqueness is enforced the same as PUT.
- **DELETE `/partners/:id`** — **204** with no body on success, **404** if
  absent. Deleting frees the email for reuse.
- PUT/PATCH/DELETE on a missing id → **404**, and 404 wins over 400: a
  request for a nonexistent resource is 404 even if the body is also invalid.
- Any other method/path combination → **404** `{ error: 'Not Found' }`.
- `id` never comes from the client: a POST body containing `id` → 400 with
  `fields: ['id']` included.

## Example

```ts
const store = new Map<string, Partner>();
let n = 0;
const handle = createPartnersHandler(store, () => `p${++n}`);

await handle({ method: 'POST', path: '/partners', headers: {}, query: {},
  body: { name: 'Acme', email: 'ops@acme.io' } });
// { status: 201, headers: { Location: '/partners/p1' },
//   body: { id: 'p1', name: 'Acme', email: 'ops@acme.io', tier: 'standard' } }
```

## Target

- The store is the injected `Map` — tests seed and inspect it directly.
- ~45 minutes.

## Interviewer follow-up

- Why 409 rather than 400 for the duplicate email — and when would 422 be the
  better fit?
- PUT returning 200-with-body vs 204: what drives the choice?
- How do these semantics change once the store is a real database with a
  unique index (see task 028)?
