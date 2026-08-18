# 001. API Response Union

**Difficulty:** Easy
**Topics:** Discriminated Unions, Narrowing, Exhaustiveness, `never`

---

## Scenario

The partner-tools dashboard polls an integration-status endpoint. The response is
in exactly one of three states — still loading, loaded with a list of integrations,
or failed with an error code. Model the response so a component can't read
`integrations` off a response that doesn't have them, and so the rendering switch
is provably exhaustive.

## Requirements

- Design `IntegrationStatusResponse` as a discriminated union on a `status` field
  with exactly three variants:
  - `'loading'` — no other fields.
  - `'success'` — carries `integrations: Integration[]` and `fetchedAt: string`.
  - `'error'` — carries `code: number` and `message: string`.
- `describeResponse(res)` returns a one-line summary via a `switch` on `res.status`:
  - loading → `'Loading integration status…'`
  - success → `` `${n} integrations (${healthy} healthy)` ``
  - error → `` `Failed (${code}): ${message}` ``
- The switch must be exhaustive: the `default` branch calls `assertNever(res)`,
  so an unhandled variant is a compile error, not a silent fallthrough.
- Accessing variant-specific fields (e.g. `res.integrations`) without narrowing
  must not compile.

## Example

```ts
describeResponse({ status: 'loading' });
// 'Loading integration status…'

describeResponse({ status: 'error', code: 503, message: 'upstream unavailable' });
// 'Failed (503): upstream unavailable'
```

If the API later documents a fourth variant, adding it to the union must break
`describeResponse` at compile time:

```ts
type TimeoutResponse = { status: 'timeout'; retryAfterMs: number };

function handle(res: IntegrationStatusResponse | TimeoutResponse): string {
  switch (res.status) {
    case 'loading': return '…';
    case 'success': return '…';
    case 'error': return '…';
    default:
      // @ts-expect-error — 'timeout' is unhandled, so res is not never here
      return assertNever(res);
  }
}
```

## Target

The compiler enforces that every variant of the union is handled and that
variant-specific fields are only readable after narrowing on `status`.

## Interviewer follow-up

Why is a discriminated union with a `never` guard safer than an optional-fields
shape like `{ loading?: boolean; data?: Integration[]; error?: string }`?
