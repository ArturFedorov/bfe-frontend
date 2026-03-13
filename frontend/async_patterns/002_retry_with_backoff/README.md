# 2. Retry with Exponential Backoff

**Difficulty:** Medium
**Topics:** Promises, Error Handling, Timers, Exponential Backoff

---

## Description

Implement a `retry` function that calls an async function and retries it on failure with exponential backoff. The delay between retries doubles by default (or multiplies by a custom `factor`). The function should resolve with the first successful result or reject after all retries are exhausted.

## Examples

```ts
const result = await retry(() => fetchData(), {
  retries: 3,
  initialDelay: 100,
  factor: 2,
});
// Attempts: immediate, then after 100ms, 200ms, 400ms
```

## Constraints

- `retries` is a non-negative integer (0 means no retries, only the initial attempt)
- `initialDelay` is in milliseconds
- `factor` defaults to 2 if not provided
- Delays are: initialDelay, initialDelay * factor, initialDelay * factor^2, ...

## Approach Hints

<details>
<summary>Hint 1</summary>
Use a loop that counts attempts. On each failure, wait for the computed delay before trying again.
</details>

<details>
<summary>Hint 2</summary>
Calculate the delay as `initialDelay * factor^attemptIndex`. Use `setTimeout` wrapped in a promise for the delay.
</details>

<details>
<summary>Hint 3</summary>
Track the current attempt number. If the attempt fails and retries remain, sleep for the delay then continue. If no retries remain, re-throw the last error.
</details>
