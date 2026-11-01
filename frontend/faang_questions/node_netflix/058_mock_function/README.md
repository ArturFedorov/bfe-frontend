# N58. Mock function

**Difficulty:** Medium
**Topics:** Testing, Closures, Higher-order Functions

---

## Description

Implement a `jest.fn()`-style mock: a callable function that records every
call's arguments and return value, and supports `mockReturnValue` and
`mockImplementation`.

## Examples

```ts
const m = fn((a, b) => a + b);
m(1, 2);          // 3
m.calls;          // [[1, 2]]
m.mockReturnValue(9);
m();              // 9
```

## Constraints

- `calls` is an array of argument tuples; `results` is an array of return values.
- `mockReturnValue` / `mockImplementation` return the mock for chaining.
