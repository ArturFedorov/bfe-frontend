# 16. Implement Once

**Difficulty:** Easy

**Topics:** JavaScript Utilities, Closures

---

## Description

Implement a `once` function that ensures the provided function is only called once. Subsequent calls return the result of the first invocation without calling the original function again.

```typescript
function once<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> | undefined
```

---

## Examples

### Example 1
```typescript
const initialize = once(() => console.log("init"));
initialize(); // logs "init"
initialize(); // does nothing
initialize(); // does nothing
```

### Example 2
```typescript
const addOnce = once((a: number, b: number) => a + b);
addOnce(1, 2); // 3
addOnce(3, 4); // 3 (returns cached result)
```

---

## Constraints

- `fn` is a valid function
- The return value of the first call is cached and returned on subsequent calls
- `this` context should be preserved for the first call

---

## Approach Hints

<details><summary>Hint 1</summary>
Use a boolean flag to track whether the function has been called.
</details>

<details><summary>Hint 2</summary>
Store the result of the first invocation in a closure variable.
</details>

---

## Related Problems

- Implement Memoize
- Implement Debounce
