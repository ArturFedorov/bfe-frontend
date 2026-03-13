# 4. Sleep

**Difficulty:** Easy
**Topics:** Promises, Timers, async/await

---

## Description

Implement a `sleep` function that returns a promise which resolves after the specified number of milliseconds. This is a basic but essential async utility used throughout async programming.

## Examples

```ts
console.log("start");
await sleep(1000);
console.log("1 second later");
```

## Constraints

- `ms` is a non-negative number
- The returned promise resolves with `undefined` (void)
- A value of 0 should still resolve asynchronously

## Approach Hints

<details>
<summary>Hint 1</summary>
Wrap `setTimeout` in a `new Promise`.
</details>

<details>
<summary>Hint 2</summary>
The resolve callback of the promise should be passed directly to `setTimeout` as the callback.
</details>

<details>
<summary>Hint 3</summary>
Remember that `setTimeout(fn, 0)` still defers execution to the next tick, so `sleep(0)` is a valid way to yield to the event loop.
</details>
