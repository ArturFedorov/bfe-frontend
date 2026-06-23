# N67. Deprecation warning system

**Difficulty:** Easy
**Topics:** API Design, Higher-order Functions

---

## Description

Implement a deprecation helper: `deprecate(fn, message)` returns a wrapper that
logs a warning the first time it's called (once per unique message), then
delegates to the original function. Provide `reset()` to clear the
already-warned set (useful in tests).

## Examples

```ts
const add = deprecate((a, b) => a + b, 'use sum() instead');
add(1, 2); // warns once, returns 3
add(3, 4); // no warning, returns 7
```

## Constraints

- Warn at most once per unique message.
- The wrapper forwards arguments and returns the original's result.
