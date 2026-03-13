# 29. Cancel All Active Timers

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Timers, Resource Management

---

## Description

Implement a `createTimerManager` function that returns a timer manager object. The manager wraps `setTimeout` and `setInterval`, tracking all active timers, and provides a `clearAll` method to cancel every active timer at once.

```typescript
function createTimerManager(): {
  setTimeout: (callback: () => void, delay: number) => number;
  setInterval: (callback: () => void, delay: number) => number;
  clearAll: () => void;
}
```

- `setTimeout(callback, delay)` — works like the native `setTimeout` but the timer is tracked.
- `setInterval(callback, delay)` — works like the native `setInterval` but the timer is tracked.
- `clearAll()` — cancels all active timers (both timeouts and intervals) that were created through this manager.

---

## Examples

### Example 1
```typescript
const manager = createTimerManager();
manager.setTimeout(() => console.log("a"), 1000);
manager.setInterval(() => console.log("b"), 500);
manager.clearAll(); // cancels both timers
```

### Example 2
```typescript
const manager = createTimerManager();
manager.setTimeout(() => console.log("first"), 100);
manager.clearAll();
manager.setTimeout(() => console.log("second"), 100);
// only "second" will fire after 100ms
```

---

## Constraints

- Must use the native `setTimeout` and `setInterval` internally
- `clearAll` should cancel all pending timers created via the manager
- After `clearAll`, new timers created via the manager should still work normally
- Completed timeouts should be cleaned up (not cleared again)

---

## Approach Hints

<details><summary>Hint 1</summary>
Store timer IDs in a Set for both timeouts and intervals separately.
</details>

<details><summary>Hint 2</summary>
When a timeout completes naturally, remove its ID from the tracking set so `clearAll` doesn't try to clear it again.
</details>

<details><summary>Hint 3</summary>
In `clearAll`, iterate the sets and call `clearTimeout` / `clearInterval` for each, then clear the sets.
</details>
