# N53. Type-safe EventEmitter

**Difficulty:** Medium
**Topics:** TypeScript, Generics, Events

---

## Description

Implement an `EventEmitter` parameterised by an event map (event name → payload
type) so that `on` and `emit` enforce the correct payload type per event.

## Examples

```ts
type Events = { click: { x: number; y: number } };
const ee = new TypedEmitter<Events>();
ee.on('click', (p) => p.x); // p is { x: number; y: number }
ee.emit('click', { x: 1, y: 2 });
```

## Constraints

- `on<K extends keyof Events>` — listener receives `Events[K]`.
- `emit<K extends keyof Events>` — payload must be `Events[K]`.
- `emit` returns `true` if at least one listener ran.
