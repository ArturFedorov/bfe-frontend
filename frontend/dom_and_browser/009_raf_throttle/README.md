# 9. requestAnimationFrame Throttle

**Difficulty:** Medium
**Topics:** Performance, requestAnimationFrame, Throttling

---

## Description

Implement a `rafThrottle` function that throttles the given function so it is called at most once per animation frame (using `requestAnimationFrame`).

When the throttled function is called multiple times before the next frame, only the **last** set of arguments should be used when the function is finally invoked.

## Examples

```ts
const throttled = rafThrottle((x: number) => console.log(x));

throttled(1);  // schedules call with arg 1
throttled(2);  // updates to arg 2 (still same frame)
throttled(3);  // updates to arg 3

// On next animation frame: logs 3
```

## Constraints

- Uses `requestAnimationFrame` to schedule the call
- Multiple calls before the frame fires should only result in one invocation
- The last arguments passed should be used
- `this` context should be preserved

## Approach Hints

<details>
<summary>Hint 1</summary>
Use a flag to track whether a `requestAnimationFrame` call is already pending.
</details>

<details>
<summary>Hint 2</summary>
Store the latest arguments each time the throttled function is called, and use those when the frame callback fires.
</details>

<details>
<summary>Hint 3</summary>
Reset the pending flag inside the `requestAnimationFrame` callback after invoking the original function.
</details>
