# 6. Lazy / Deferred Promise

**Difficulty:** Easy
**Topics:** Promises, Deferred Pattern

---

## Description

Implement a `createDeferred` function that returns an object with a `promise` and external `resolve` and `reject` functions. This allows controlling when and how a promise settles from outside the promise constructor.

## Examples

```ts
const deferred = createDeferred<number>();

setTimeout(() => deferred.resolve(42), 1000);

const result = await deferred.promise; // 42
```

## Constraints

- `resolve` and `reject` should control the returned promise
- Calling `resolve` or `reject` multiple times should have no effect after the first call (standard promise behavior)
- The promise should remain pending until `resolve` or `reject` is called

## Approach Hints

<details>
<summary>Hint 1</summary>
Store the `resolve` and `reject` callbacks from inside the `new Promise` executor and expose them on the returned object.
</details>

<details>
<summary>Hint 2</summary>
The executor function runs synchronously, so the stored callbacks are available immediately after constructing the promise.
</details>

<details>
<summary>Hint 3</summary>
You don't need extra logic to ignore multiple calls — JavaScript promises natively settle only once.
</details>
