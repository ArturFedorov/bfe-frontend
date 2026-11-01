# N59. Spy on object method

**Difficulty:** Medium
**Topics:** Testing, Object Wrapping

---

## Description

Implement a `jest.spyOn`-style spy: wrap `obj[method]`, record its calls while
still invoking the original implementation, and expose `restore()` to put the
original method back.

## Examples

```ts
const spy = spyOn(obj, 'greet');
obj.greet('a'); // still runs original
spy.calls;      // [['a']]
spy.restore();  // obj.greet is the original again
```

## Constraints

- The original is called through and its return value preserved.
- After `restore()`, `obj[method]` is the exact original reference.
