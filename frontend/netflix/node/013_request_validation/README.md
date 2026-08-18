# 013. Request Validation

**Difficulty:** Medium
**Topics:** REST, Validation, Type Coercion, Error Design

---

## Scenario

Every partner-facing endpoint keeps reinventing input checking — and each one
reports errors differently, which partners rightly complain about. You are
building the one declarative validator the whole API uses: a schema describes
the body and query, the wrapper enforces it, and failures come back as a
machine-readable list a partner's client can map onto form fields. Query
strings arrive as strings, so the validator also owns coercion (`'25'` → 25).

## Requirements

- `withValidation(schema, handler)` returns a `Handler`. The schema has
  optional `body` and `query` sections, each
  `Record<string, { type: 'string' | 'number' | 'boolean'; required?: boolean }>`.
- **On failure → 400** with body
  `{ error: 'Validation failed', errors: FieldError[] }` where each
  `FieldError` is `{ path: string; code: string; message: string }` — path is
  dotted (`'body.name'`, `'query.limit'`), and `message` is human-readable.
  ALL problems are reported in one response, never just the first.
- **Codes (exact):**
  - `required` — a `required: true` field is absent;
  - `invalid_type` — a body field has the wrong runtime type (body values
    are never coerced: `'5'` is not a number, `1` is not a boolean); also
    used with path `'body'` when a body schema exists but the body is not an
    object (that single error replaces all body field checks);
  - `unknown_field` — a body/query key not present in the schema section;
  - `not_coercible` — a query value that cannot be coerced to the declared
    type.
- **Query coercion:** query values arrive as strings. `string` passes
  through; `number` accepts `/^-?\d+(\.\d+)?$/` and yields a `number`;
  `boolean` accepts exactly `'true'`/`'false'` and yields a `boolean`.
- **Error ordering:** body section first, then query. Within a section:
  schema-declared fields in schema key order, then unknown fields in input
  key order.
- **On success** the wrapped handler is called as `handler(req, data)` where
  `data = { body, query }` contains the validated body fields and the
  *coerced* query values; optional fields that were absent are absent from
  `data`. A schema without a `body` (or `query`) section skips that part
  entirely and yields `{}` for it.

## Example

```ts
const handler = withValidation(
  {
    body: { name: { type: 'string', required: true }, dryRun: { type: 'boolean' } },
    query: { limit: { type: 'number' } },
  },
  (req, data) => ({ status: 200, body: data }),
);

await handler({ method: 'POST', path: '/reports', headers: {},
  query: { limit: '25' }, body: { name: 'Q3', dryRun: true } });
// { status: 200, body: { body: { name: 'Q3', dryRun: true }, query: { limit: 25 } } }

await handler({ method: 'POST', path: '/reports', headers: {},
  query: { limit: 'lots' }, body: {} });
// 400 — errors: [ { path: 'body.name', code: 'required', ... },
//                 { path: 'query.limit', code: 'not_coercible', ... } ]
```

## Target

- Pure function of (schema, request) — no schema compilation step needed.
- ~45 minutes.

## Interviewer follow-up

- How would you extend the spec language with `min`/`max`/`enum` without
  turning it into a worse zod?
- Why reject unknown fields instead of silently stripping them — and when is
  stripping the right call?
- Where does this sit relative to the 010 middleware chain — validator as
  middleware vs wrapper, and what changes?
