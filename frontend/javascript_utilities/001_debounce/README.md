# 1. Implement Debounce

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Closures, Timers

---

## Description

Implement a `debounce` function that delays invoking the provided function until after `wait` milliseconds have elapsed since the last time the debounced function was invoked.

The debounced function should:
1. Delay the invocation of `func` by `wait` milliseconds after the last call
2. If called again before the delay expires, reset the timer
3. Pass the latest arguments to the invoked function
4. Use the correct `this` context

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

---

## Examples

### Example 1
```typescript
const debounced = debounce(console.log, 100);
debounced("a");
debounced("b");
debounced("c");
// After 100ms, logs: "c"
```

### Example 2
```typescript
const debounced = debounce((x: number) => x * 2, 50);
debounced(1);
// wait 60ms
debounced(2);
// After 50ms, invokes with 2
```

---

## Constraints

- `wait` is a non-negative integer
- `func` is a valid function
- The debounced function may be called any number of times

---

## Approach Hints

<details><summary>Hint 1</summary>
You need to track a timer ID using `setTimeout` and `clearTimeout`.
</details>

<details><summary>Hint 2</summary>
Each new call should clear the previous timer and start a new one.
</details>

<details><summary>Hint 3</summary>
Make sure to preserve `this` context — use `.apply()` or `.call()`.
</details>

---

## Related Problems

- Implement Throttle
- Implement Debounce with Leading Option
- Implement Debounce with Cancel

---

### What a Google Interviewer Would Ask Next

1. **How would you add a `leading` option?** — Invoke on the leading edge of the timeout instead of trailing.
2. **How would you add a `cancel` method?** — Allow the consumer to cancel pending invocations.
3. **How would you add a `flush` method?** — Immediately invoke the pending function.
4. **What about the return value?** — How to return a Promise for the result.
5. **How does this differ from throttle?** — Throttle guarantees execution at most once per interval.
