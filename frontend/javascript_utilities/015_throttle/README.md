# 15. Implement Throttle

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Closures, Timers

---

## Description

Implement a `throttle` function that ensures the provided function is invoked at most once per `wait` milliseconds. It should support `leading` and `trailing` options.

- **leading** (default `true`): Invoke on the leading edge of the timeout
- **trailing** (default `true`): Invoke on the trailing edge of the timeout

```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): (...args: Parameters<T>) => void
```

---

## Examples

### Example 1
```typescript
const throttled = throttle(console.log, 100);
throttled("a"); // logs "a" immediately
throttled("b"); // skipped
throttled("c"); // logs "c" after 100ms
```

### Example 2
```typescript
const throttled = throttle(fn, 100, { leading: false });
throttled("x"); // does NOT invoke immediately
// After 100ms, invokes with "x"
```

---

## Constraints

- `wait` is a non-negative integer
- `func` is a valid function
- Both `leading` and `trailing` default to `true`
- If both `leading` and `trailing` are `false`, `leading` is treated as `true`

---

## Approach Hints

<details><summary>Hint 1</summary>
Track the last invocation time and use `setTimeout` for trailing calls.
</details>

<details><summary>Hint 2</summary>
Store the latest arguments so the trailing call uses the most recent values.
</details>

<details><summary>Hint 3</summary>
Make sure to preserve `this` context using `.apply()`.
</details>

---

## Related Problems

- Implement Debounce
- Implement Rate Limiter
