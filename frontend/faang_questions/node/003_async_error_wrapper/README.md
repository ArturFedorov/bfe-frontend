# 003. Async Error Wrapper

**Difficulty:** Medium
**Topics:** Error Classification, Operational vs Programmer Errors, Higher-Order Functions

---

## Scenario

The partner onboarding service wraps every handler in a blanket
`try { … } catch { return 500 }`. Result: a partner submitting a duplicate tax
ID gets the same opaque 500 as a genuine `TypeError` from a refactor gone
wrong — and the `TypeError` never crashes the process, so it ships to prod and
lingers for weeks. Build the wrapper the right way: **operational** errors
(expected failures: bad input, missing partner, conflicts) are caught and
formatted into a response; **programmer** errors (bugs) are rethrown so the
process supervisor can restart cleanly.

## Requirements

- `OperationalError` base class: `message`, a machine-readable `code`, and an
  HTTP-ish `statusCode` (default `500`). Subclasses must work with
  `instanceof` (watch the TS prototype-chain gotcha).
- Ship two concrete subclasses: `NotFoundError` (`code: 'NOT_FOUND'`, `404`)
  and `ValidationError` (`code: 'VALIDATION'`, `400`).
- `isOperationalError(err)` — type-guard, safe on any input (`null`, strings,
  plain objects with a `code` field must NOT pass).
- `withErrorHandling(handler)` wraps any async function, preserving its
  argument list:
  - handler resolves → `{ ok: true, value }`;
  - handler throws/rejects an `OperationalError` (or subclass) →
    `{ ok: false, error: { code, message, statusCode } }` — the raw error
    object is not leaked;
  - handler throws anything else (`TypeError`, plain `Error`, a thrown
    string) → the wrapper **rethrows it unchanged**: same reference, no
    wrapping, no formatting.
- A synchronous throw inside the handler behaves identically to a rejection.

## Example

```ts
const getPartner = withErrorHandling(async (id: string) => {
  const partner = store.get(id);
  if (!partner) throw new NotFoundError(`partner ${id} not found`);
  return partner;
});

await getPartner('p-1');   // { ok: true, value: { … } }
await getPartner('nope');  // { ok: false, error: { code: 'NOT_FOUND', statusCode: 404, … } }
await getPartner(undefined as never); // TypeError propagates — process crashes, supervisor restarts
```

## Target

20–25 minutes. The senior signals: the `instanceof`-based classification (not
duck typing), rethrowing programmer errors by reference, and knowing WHY you
let bugs crash the process instead of swallowing them.

## Interviewer follow-up

An operational error thrown by a third-party SDK doesn't extend your
`OperationalError` — it's their own class with `{ isRetryable: true }`. How do
you integrate it without letting duck typing back in everywhere?
