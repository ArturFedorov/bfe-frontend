# 006. Request Context

**Difficulty:** Medium
**Topics:** AsyncLocalStorage, Context Propagation, Structured Logging

---

## Scenario

Debugging a partner delivery failure means grepping logs across five service
layers — but only the top-level handler knows the request id, so the deeper
log lines are anonymous. Threading `requestId` through every function
signature was vetoed (it touched 200 call sites). Use `AsyncLocalStorage`:
establish the context once at the edge, and let the logger pick up the right
request id anywhere down the async call chain — timers, promises, nested
awaits — with zero parameter drilling.

## Requirements

- `runWithContext(requestId, fn)` runs `fn` inside a context carrying the id
  and returns `fn`'s promise (value and rejection pass through unchanged).
- `getRequestId()` returns the current context's id, or `undefined` outside
  any context — it must never throw.
- `createLogger(sink)` returns a logger with `info(message)` and
  `error(message)`; every entry pushed to the sink is
  `{ requestId, level, message }` where `requestId` is read from the ambient
  context **at call time**, not at logger creation time.
- The id survives async hops inside `fn`: `await`ed promises, `setTimeout`
  callbacks, `queueMicrotask`, and nested function calls that know nothing
  about the context.
- Two contexts running interleaved (e.g. `Promise.all` of two
  `runWithContext` calls that yield back and forth) never see each other's
  ids — no bleed, no last-write-wins.
- Nested `runWithContext` inside an outer context shadows the id for the
  inner scope and restores the outer id afterwards.
- One module-level `AsyncLocalStorage` instance; no globals holding "the
  current id" by hand.

## Example

```ts
const logger = createLogger((entry) => sink.push(entry));

async function chargePartner() {
  await settle();
  logger.info('charged'); // no requestId parameter anywhere in sight
}

await runWithContext('req-42', () => chargePartner());
// sink: [{ requestId: 'req-42', level: 'info', message: 'charged' }]
```

## Target

20–25 minutes. The senior signals: knowing `AsyncLocalStorage#run` scopes by
async execution context (so interleaving just works), and reading the store
at log-call time instead of capturing it in a closure.

## Interviewer follow-up

A teammate wraps a callback-based legacy client (events emitted from a socket
pool shared across requests) and the ids come out wrong. Why does ALS lose
the context there, and what does `AsyncResource` / `EventEmitter.captureRejections`-era
tooling offer to fix it?
