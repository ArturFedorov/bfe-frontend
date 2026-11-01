# 015. Typed Event Emitter

**Difficulty:** Hard
**Topics:** Generic classes, mapped payload types, API design (the classic senior screen)

---

## Scenario

The integrations console reacts to a stream of partner lifecycle events — connects,
disconnects, report completions — and the current emitter is `on(event: string,
handler: (payload: any) => void)`. Handlers crash on shape drift and nobody notices at
review time. You're rebuilding it as `TypedEmitter<Events>` over an event→payload map:
subscribe to `'report:ready'` and the handler's payload *is* `{ reportId; rows }`,
emit with the wrong shape and it doesn't compile.

## Requirements

- Design the types for `TypedEmitter<Events>` where `Events` is a map from event name to payload type (`IntegrationEvents` is given).
- `on(event, handler)` — handler's payload parameter is inferred as `Events[E]` for the exact event name.
- `emit(event, payload)` — payload must match that event's type; unknown event names don't compile.
- `off(event, handler)` — removes a previously registered handler.
- `once(event, handler)` — handler runs on the first matching emit only.
- Runtime: multiple handlers per event, emit with no handlers is a no-op, handler list is isolated per event.

## Example

```ts
const emitter = new TypedEmitter<IntegrationEvents>();

emitter.on('report:ready', (payload) => payload.rows);      // payload: { reportId: string; rows: number }
emitter.emit('partner:connected', { partnerId: 'p-1', at: Date.now() });
emitter.emit('report:ready', { reportId: 'r-1' });          // compile error — missing rows
emitter.on('nope', () => {});                                // compile error — unknown event
```

## Target

~30 min. Done = jest suite green: runtime tests pass **and** every inline type
assertion compiles (the compile errors are part of the test suite). The stub is
deliberately `any`-typed — designing the method signatures is the task.

## Interviewer follow-up

- How do you type the internal handler storage without `any`? Where does one honest cast (if any) belong, and why?
- What changes if payloads are spread as `emit(event, ...args)` with tuple payload types?
- `once` wraps the handler — how does that interact with `off(event, originalHandler)`? How does Node's emitter solve it?
