# 1. Implement Debounce

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Closures, Timers

---

## Description

Implement a `debounce` function that delays invoking the provided function until after `delay` milliseconds have elapsed since the last invocation, with optional `leading` and `trailing` edge control.

The debounced function should:
1. Delay the invocation of `fn` by `delay` milliseconds after the last call (trailing, default)
2. If called again before the delay expires, reset the timer
3. Pass the latest arguments to the invoked function
4. Use the correct `this` context
5. Support `leading: true` to invoke immediately on the first call
6. Support `trailing: false` to suppress the trailing-edge invocation

```typescript
interface DebounceOptions {
  leading?: boolean;  // invoke on the leading edge (default: false)
  trailing?: boolean; // invoke on the trailing edge (default: true)
}

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options?: DebounceOptions
): (...args: Parameters<T>) => void
```

---

## Examples

### Example 1 — default (trailing only)
```typescript
const debounced = debounce(console.log, 100);
debounced("a");
debounced("b");
debounced("c");
// After 100ms → logs: "c"
```

### Example 2 — leading only
```typescript
const debounced = debounce(console.log, 100, { leading: true, trailing: false });
debounced("a"); // logs immediately: "a"
debounced("b"); // ignored (within delay window)
debounced("c"); // ignored (within delay window)
// nothing logged after 100ms
```

### Example 3 — leading + trailing
```typescript
const debounced = debounce(console.log, 100, { leading: true, trailing: true });
debounced("a"); // logs immediately: "a"
debounced("b");
debounced("c");
// After 100ms → logs: "c"
```

---

## Constraints

- `delay` is a non-negative integer
- `fn` is a valid function
- `options.leading` defaults to `false`
- `options.trailing` defaults to `true`
- When `leading: true, trailing: true` and only one call is made, the trailing edge should **not** fire (no duplicate invocation)
- The debounced function may be called any number of times

---

## Approach Hints

<details><summary>Hint 1</summary>
Track a timer ID using `setTimeout` and `clearTimeout`. Each new call clears the previous timer.
</details>

<details><summary>Hint 2</summary>
For `leading`, invoke immediately on the first call (when no timer is active), then start the cooldown timer.
</details>

<details><summary>Hint 3</summary>
For `trailing`, schedule the invocation inside `setTimeout`. If `leading` is also true, only fire trailing when there were additional calls after the leading invocation (track with a flag).
</details>

<details><summary>Hint 4</summary>
Preserve `this` context — use `.apply()` or `.call()`, or capture `this` with a non-arrow wrapper function.
</details>

---

## Related Problems

- Implement Throttle
- Implement Debounce with Cancel
- Implement Debounce with Flush

---

### What a Google Interviewer Would Ask Next

1. **How would you add a `cancel` method?** — Allow the consumer to cancel pending invocations.
2. **How would you add a `flush` method?** — Immediately invoke the pending trailing call.
3. **What about the return value?** — How to return a Promise for the result.
4. **How does this differ from throttle?** — Throttle guarantees execution at most once per interval; debounce delays until quiet.
5. **What's the behaviour when `leading: true, trailing: true` and only one call fires?** — Should not invoke twice.
