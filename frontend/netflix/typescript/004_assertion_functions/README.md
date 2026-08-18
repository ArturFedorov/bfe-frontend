# 004. Assertion Functions

**Difficulty:** Medium
**Topics:** Assertion Functions, `asserts`, Narrowing, Invariants

---

## Scenario

The delivery pipeline for partner assets has steps that only make sense once a
delivery is in a specific state — you can't print a receipt for a package still
in transit. Instead of sprinkling `if`/`throw` blocks and repeating the narrowing
everywhere, write assertion functions: one call both enforces the invariant at
runtime and narrows the type for every line after it.

## Requirements

- `assertDelivered(status: DeliveryStatus): asserts status is Delivered` —
  throws `` `Expected delivered, got ${status.state}` `` for any other variant;
  after the call, `status` **is** `Delivered` (post-call `Equal` assertion).
- `assertPresent<T>(value: T | null | undefined, label: string): asserts value is T`
  — throws `` `${label} is missing` `` on `null`/`undefined`; generic, reusable.
- `getReceipt(status: DeliveryStatus): string` — calls `assertDelivered`, then
  returns `status.receipt` with no extra narrowing and no casts.
- `Delivered` is derived from the union (`Extract`), not written by hand.
- Assertion functions must have explicit `asserts` return annotations —
  TypeScript will not infer them here.

## Example

```ts
declare const status: DeliveryStatus;
// status.receipt        <- does not compile
assertDelivered(status);
status.receipt;          // compiles: status is Delivered from here on

assertPresent(config.webhookUrl, 'webhookUrl');
config.webhookUrl.startsWith('https://'); // string, not string | undefined
```

## Target

Calling the assertion function narrows the variable for all subsequent code —
verified by `Equal` assertions placed *after* the call.

## Interviewer follow-up

What's the difference between `asserts status is Delivered` and a type predicate
`status is Delivered` — when does control flow behave differently, and why must
the assertion's callee have an explicit type annotation?
