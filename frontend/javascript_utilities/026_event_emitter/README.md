# 26. Implement EventEmitter

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Design Patterns, Observer Pattern

---

## Description

Implement an `EventEmitter` class that supports the following methods:

- `on(event, listener)` — registers a listener for the given event. Returns `this` for chaining.
- `off(event, listener)` — removes a specific listener for the given event. Returns `this` for chaining.
- `once(event, listener)` — registers a listener that fires at most once. Returns `this` for chaining.
- `emit(event, ...args)` — invokes all listeners for the given event with the provided arguments. Returns `true` if the event had listeners, `false` otherwise.

```typescript
class EventEmitter {
  on(event: string, listener: (...args: any[]) => void): this
  off(event: string, listener: (...args: any[]) => void): this
  once(event: string, listener: (...args: any[]) => void): this
  emit(event: string, ...args: any[]): boolean
}
```

---

## Examples

### Example 1
```typescript
const emitter = new EventEmitter();
emitter.on("data", (x) => console.log(x));
emitter.emit("data", 42); // logs 42, returns true
```

### Example 2
```typescript
const emitter = new EventEmitter();
emitter.once("init", () => console.log("initialized"));
emitter.emit("init"); // logs "initialized", returns true
emitter.emit("init"); // returns false
```

### Example 3
```typescript
const emitter = new EventEmitter();
emitter.emit("unknown"); // returns false
```

---

## Constraints

- Listeners are called in the order they were registered
- `off` should only remove the first matching reference of the listener
- `once` listeners should be automatically removed after firing
- All methods except `emit` should return `this` for chaining

---

## Approach Hints

<details><summary>Hint 1</summary>
Use a `Map` or plain object to store arrays of listeners keyed by event name.
</details>

<details><summary>Hint 2</summary>
For `once`, consider wrapping the listener in a function that calls `off` after the first invocation.
</details>

<details><summary>Hint 3</summary>
Be careful when removing listeners during iteration — consider iterating over a copy of the array.
</details>
