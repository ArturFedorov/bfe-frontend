# 007. Narrowing Traps

**Difficulty:** Medium
**Topics:** Narrowing, Control Flow Analysis, Optional Chaining, Destructuring

---

## Scenario

A teammate ported four helpers from JavaScript into the partner-tools codebase
and hit four different compiler errors — each one a classic narrowing trap. The
JavaScript logic is correct; the code below is their attempt, kept as reference.
Reimplement each function so it compiles under `strict` with the same behavior —
no `any`, no casts, no non-null assertions.

```ts
// ── The broken originals (do NOT paste these in — they don't compile) ──────
//
// 1. Optional chain in a comparison: attempts may be undefined
// function shouldAlert(config: RetryConfig): boolean {
//   return config.retry?.attempts > 3;
//   //     ~~~~~~~~~~~~~~~~~~~~~~~ number | undefined can't be compared
// }
//
// 2. typeof can't probe a property the union doesn't share
// function payloadSize(payload: Payload): number {
//   if (typeof payload.text === 'string') return payload.text.length;
//   //         ~~~~~~~~~~~~ Property 'text' does not exist on type 'Payload'
//   return payload.blob.byteLength;
// }
//
// 3. Element access with a mutable index doesn't narrow
// function sumDefined(values: (number | undefined)[]): number {
//   let total = 0;
//   for (let i = 0; i < values.length; i += 1) {
//     if (values[i] !== undefined) total += values[i];
//     //                           ~~~~~ still number | undefined
//   }
//   return total;
// }
//
// 4. Destructuring a union field that only one variant has
// function unwrap(result: DeliveryResult): number {
//   const { value } = result;
//   //      ~~~~~ Property 'value' does not exist on type 'DeliveryResult'
//   return value;
// }
```

## Requirements

- `shouldAlert(config: RetryConfig): boolean` — `true` iff `retry.attempts > 3`;
  a missing `retry` block means no alert.
- `payloadSize(payload: Payload): number` — `text.length` for text payloads,
  `blob.byteLength` for binary ones; narrow with the right operator for a
  non-shared property.
- `sumDefined(values: (number | undefined)[]): number` — sum of the defined
  entries; make the element narrowing stick.
- `unwrap(result: DeliveryResult): number` — return `value` on success, throw
  `new Error(result.error)` on failure; narrow **before** destructuring.
- No `any`, no `as` casts, no `!` assertions — fix the narrowing, don't silence it.

## Example

```ts
shouldAlert({ retry: { attempts: 5, backoffMs: 100 } }); // true
shouldAlert({});                                          // false
payloadSize({ text: 'hello' });                           // 5
sumDefined([1, undefined, 2, undefined, 3]);              // 6
unwrap({ ok: true, value: 7 });                           // 7
```

## Target

All four functions compile under `strict` via correct narrowing, and the test
file proves each original pattern still fails to compile (`@ts-expect-error`).

## Interviewer follow-up

Why does extracting `values[i]` into a `const` make narrowing work in case 3 —
what does TypeScript's control-flow analysis track for element accesses, and
when does the same aliasing trick fail (hint: mutation between check and use)?
