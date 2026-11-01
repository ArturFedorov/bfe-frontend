# N34. EventEmitter

**Difficulty:** Medium
**Topics:** Events, Pub/Sub, Edge Cases

---

## Description

Implement `on`, `off`, `once`, and `emit`. Handle the classic edge case where a
listener removes a listener during `emit`.

## Examples

```ts
ee.on('data', fn); ee.emit('data', payload);
ee.once('ready', fn); // fires once
```

## Constraints

- `emit` returns true if at least one listener ran.
- Mutating listeners during `emit` must not corrupt the current dispatch (snapshot).
