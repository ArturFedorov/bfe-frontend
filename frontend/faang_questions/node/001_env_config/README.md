# 001. Env Config

**Difficulty:** Easy
**Topics:** Configuration, Validation, Type Coercion, Fail-Fast

---

## Scenario

Every partner lifecycle service in the fleet boots from environment variables —
database URL, port, feature flags, retry budgets. Today each service reads
`process.env` ad hoc, so a missing `DELIVERY_DB_URL` surfaces as a cryptic
`undefined` crash twenty seconds into serving traffic, and a typo'd
`RETRY_LIMIT=fast` silently becomes `NaN`. Build the shared config loader:
declare the schema once, validate everything at startup, and fail fast with
**one** report that lists every problem — not just the first.

## Requirements

- `loadConfig(env, spec)` takes the environment as a **parameter**
  (`Record<string, string | undefined>`) — never touch `process.env` directly,
  so tests can inject any environment.
- Each spec entry declares the env var name, a `type` (`'string' | 'number' |
  'boolean'`), an optional `required` flag, and an optional `default`.
- A variable that is absent or an empty string counts as **missing**.
- Missing + `required` → collected as an error. Missing + `default` → the
  default is used as-is. Missing + neither → the key is `undefined`.
- Coercion: `'number'` uses numeric parsing and rejects anything that is not a
  finite number; `'boolean'` accepts exactly `'true'`/`'1'` → `true` and
  `'false'`/`'0'` → `false` (case-insensitive), everything else is invalid.
- All missing required vars AND all coercion failures are aggregated into a
  single `ConfigError` carrying `missing: string[]` and
  `invalid: { key, reason }[]`, with every env var name in the message.
- On success, returns a plain object keyed by the spec keys with coerced values.

## Example

```ts
const spec = {
  dbUrl: { env: 'DELIVERY_DB_URL', type: 'string', required: true },
  port: { env: 'PORT', type: 'number', default: 8080 },
  verbose: { env: 'VERBOSE', type: 'boolean', default: false },
} as const;

loadConfig({ DELIVERY_DB_URL: 'postgres://…', PORT: '3000' }, spec);
// → { dbUrl: 'postgres://…', port: 3000, verbose: false }

loadConfig({ PORT: 'fast' }, spec);
// → throws ConfigError: missing = ['DELIVERY_DB_URL'],
//   invalid = [{ key: 'PORT', reason: 'expected a number, got "fast"' }]
```

## Target

15–20 minutes. The senior signals: env injected as a parameter (testability),
errors aggregated instead of throw-on-first, and empty string treated the same
as absent.

## Interviewer follow-up

Your services also read secrets (API keys) through this loader. What would you
change so a `ConfigError` — which gets logged — can never leak a secret value,
while still being debuggable?
