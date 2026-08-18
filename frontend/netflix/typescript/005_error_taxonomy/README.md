# 005. Error Taxonomy

**Difficulty:** Medium
**Topics:** Discriminated Unions, `satisfies`, Exhaustiveness, Mapped Types

---

## Scenario

The partner-tools client funnels every failure — fetch errors, form validation,
expired tokens, and the inevitable "something else" — into one `AppError` union
that the UI turns into user-facing messages. The team keeps adding error kinds;
the handler map must be structured so that adding a variant to the union breaks
the build until someone writes its message, instead of rendering `undefined`.

## Requirements

- `AppError` is a discriminated union on `kind` with exactly four variants:
  - `network` — `status: number`, `url: string`
  - `validation` — `field: string`, `message: string`
  - `auth` — `reason: 'expired' | 'missing'`
  - `unknown` — `cause: unknown`
- Design `ErrorKind` (the discriminant union), `ErrorByKind<K>` (the variant for
  one kind, via `Extract`), and `ErrorHandlerMap` — a mapped type requiring one
  handler per kind, each typed `(error: ErrorByKind<K>) => string`.
- `errorHandlers` is a plain object checked with `satisfies ErrorHandlerMap` —
  no type annotation, so each handler's parameter stays precisely narrowed.
- `describeError(error: AppError): string` dispatches to the map. Messages:
  - network → `` `Network ${status} on ${url}` ``
  - validation → `` `Validation failed on ${field}: ${message}` ``
  - auth → `` `Auth error: token ${reason}` ``
  - unknown → `` `Unknown error: ${String(cause)}` ``
- A handler map missing a kind, or a handler typed for the wrong variant, must
  not compile.

## Example

```ts
describeError({ kind: 'network', status: 503, url: '/v1/partners' });
// 'Network 503 on /v1/partners'

describeError({ kind: 'auth', reason: 'expired' });
// 'Auth error: token expired'
```

## Target

`ErrorHandlerMap` + `satisfies` make the handler map provably exhaustive and
per-kind narrowed — adding a fifth `AppError` variant fails compilation until a
handler exists.

## Interviewer follow-up

Compare this satisfies-checked handler map with an exhaustive `switch` +
`assertNever` (task 001): which failure surfaces earlier, and which pattern
scales better when several modules each need to handle every error kind?
