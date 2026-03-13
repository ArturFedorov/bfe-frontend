# 3. Cancelable Promise

**Difficulty:** Medium
**Topics:** Promises, AbortController, Cancellation

---

## Description

Implement a `makeCancelable` function that wraps a promise, returning an object with the wrapped promise and a `cancel` function. When `cancel` is called before the promise settles, the wrapped promise should reject with an error whose message is `"Canceled"`. If the original promise has already settled, calling `cancel` should be a no-op.

## Examples

```ts
const { promise, cancel } = makeCancelable(fetchData());

setTimeout(() => cancel(), 100);

try {
  await promise;
} catch (e) {
  console.log(e.message); // "Canceled"
}
```

## Constraints

- The cancel function should cause rejection with `Error("Canceled")`
- Calling cancel after settlement is a no-op
- The original promise's result should pass through if not canceled

## Approach Hints

<details>
<summary>Hint 1</summary>
Create a new promise that races the original promise against a rejection triggered by the cancel function.
</details>

<details>
<summary>Hint 2</summary>
Store the reject function from the wrapper promise's executor. The cancel function calls this stored reject with the cancellation error.
</details>

<details>
<summary>Hint 3</summary>
Use a boolean flag to track whether the promise has settled. Both the original promise's resolution/rejection and the cancel call should set this flag so subsequent calls are no-ops.
</details>
