# 006. Webhook Event Map

**Difficulty:** Medium
**Topics:** Discriminated Unions, Mapped Types, Handler Registries, Narrowing

---

## Scenario

Partners subscribe to webhook events from the delivery platform — a delivery was
created, a delivery failed, a partner account got linked. The dispatcher owns a
registry with one handler per event type. Today it's `Record<string, (e: any) => void>`
and a handler for `partner.linked` happily reads `event.errorCode`. Type the
registry so each handler's parameter **is** its event — no `any`, no casts.

## Requirements

- `WebhookEvent` is a discriminated union on `type` with exactly three variants:
  - `'delivery.created'` — `deliveryId: string`, `partnerId: string`
  - `'delivery.failed'` — `deliveryId: string`, `errorCode: number`
  - `'partner.linked'` — `partnerId: string`, `linkedBy: string`
- Design `WebhookEventType` (the discriminant union), `EventOfType<T>` (one
  variant via `Extract`), and `HandlerRegistry` — a mapped type with one
  required handler per event type, each typed `(event: EventOfType<T>) => void`.
- Inside a registry literal, handler parameters must be **inferred** from the
  key — writing `'delivery.failed': (event) => …` gives `event.errorCode: number`
  with no annotation.
- `dispatchEvent(registry: HandlerRegistry, event: WebhookEvent): void` routes
  the event to its handler — no casts.
- A registry missing an event type, or a handler reading a field from the wrong
  variant, must not compile.

## Example

```ts
const registry: HandlerRegistry = {
  'delivery.created': (event) => log(event.deliveryId, event.partnerId),
  'delivery.failed': (event) => alertOnCall(event.deliveryId, event.errorCode),
  'partner.linked': (event) => audit(event.partnerId, event.linkedBy),
};

dispatchEvent(registry, { type: 'delivery.failed', deliveryId: 'd-1', errorCode: 429 });
// only the 'delivery.failed' handler runs, fully typed
```

## Target

Each registry handler's parameter type narrows to exactly its event variant
(per-key `Equal` assertions), and an incomplete registry is a compile error.

## Interviewer follow-up

`dispatchEvent` does `registry[event.type](event)` — why does TypeScript reject
that line even though it's runtime-safe, and what are two ways to make it
compile without `any` or a cast?
