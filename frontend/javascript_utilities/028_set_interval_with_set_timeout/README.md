# 28. Implement setInterval using setTimeout

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Timers, Closures

---

## Description

Implement a `mySetInterval` function that mimics the behavior of `setInterval` but uses only `setTimeout` internally.

The function should:
1. Repeatedly call the callback at the specified delay
2. Return an object with a `clear` method to stop the interval
3. Pass any additional arguments to the callback
4. Not call the callback immediately — the first call should happen after the delay

```typescript
function mySetInterval(
  callback: (...args: any[]) => void,
  delay: number,
  ...args: any[]
): { clear: () => void }
```

---

## Examples

### Example 1
```typescript
const interval = mySetInterval(() => console.log("tick"), 1000);
// logs "tick" every 1000ms
interval.clear(); // stops the interval
```

### Example 2
```typescript
const interval = mySetInterval((x) => console.log(x), 500, "hello");
// logs "hello" every 500ms
```

---

## Constraints

- Must use `setTimeout` internally (not the native `setInterval`)
- The callback should not be called immediately
- `clear()` should prevent any future invocations
- Additional arguments should be forwarded to the callback

---

## Approach Hints

<details><summary>Hint 1</summary>
Use a recursive `setTimeout` — each time the callback fires, schedule the next one.
</details>

<details><summary>Hint 2</summary>
Track a boolean or timer ID to know when `clear` has been called so you can stop scheduling.
</details>

<details><summary>Hint 3</summary>
Make sure `clear` also cancels any currently pending `setTimeout` to avoid one extra invocation.
</details>
