# 003. Unknown Boundary

**Difficulty:** Medium
**Topics:** `unknown`, Narrowing, Runtime Validation, Type Predicates

---

## Scenario

Partner webhooks arrive as `JSON.parse` output — `unknown` until proven otherwise.
A delivery-completed webhook must be validated at the boundary and handed to the
rest of the codebase as a fully typed `DeliveryWebhook`. Bad payloads must fail
loudly with the exact field path, so on-call can tell a partner precisely which
field their integration got wrong.

## Requirements

- `parseDeliveryWebhook(payload: unknown): DeliveryWebhook` — returns a typed
  object or throws; **zero `as` casts** (no `as X`, `as any`, `as unknown`,
  `as const`, no `!` non-null assertions). Narrowing only — a test greps the
  source to enforce this.
- `isRecord(value: unknown): value is Record<string, unknown>` — the reusable
  object guard (`typeof === 'object'`, non-null, not an array).
- Validation contract (error messages use `Invalid webhook at <path>: expected <what>`,
  where the root path is `$`):
  - payload must be an object → path `$`
  - `event` must be exactly `'delivery.completed'` → path `$.event`
  - `deliveryId`, `partnerId` must be strings → `$.deliveryId`, `$.partnerId`
  - `assets` must be an array → `$.assets`; each element an object with
    `id: string` and finite `sizeBytes: number` → e.g. `$.assets[1].sizeBytes`

## Example

```ts
const parsed = parseDeliveryWebhook(JSON.parse(body));
// parsed: DeliveryWebhook — parsed.assets[0].sizeBytes is a number

parseDeliveryWebhook({ event: 'delivery.completed', deliveryId: 7 });
// throws: Invalid webhook at $.deliveryId: expected string

parseDeliveryWebhook({ ...valid, assets: [{ id: 'a', sizeBytes: 1 }, { id: 'b' }] });
// throws: Invalid webhook at $.assets[1].sizeBytes: expected number
```

## Target

`unknown` becomes `DeliveryWebhook` through control-flow narrowing alone — the
source contains no cast syntax, verified by a test that reads the file.

## Interviewer follow-up

Why is a parameter typed `unknown` strictly safer than `any` here, and where in
a webhook pipeline is the *one* place `unknown` should appear?
