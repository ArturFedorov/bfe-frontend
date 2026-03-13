# 14. Implement a Basic Promise from Scratch

**Difficulty:** Hard

**Topics:** JavaScript Utilities, Promises, Async Patterns

---

## Description

Implement a `MyPromise` class that mimics the core behavior of the native `Promise`. Your implementation should support:

1. Constructor that accepts an executor function `(resolve, reject) => void`
2. `.then()` for chaining, which returns a new `MyPromise`
3. `.catch()` for error handling
4. Static `MyPromise.resolve()` and `MyPromise.reject()` methods

```typescript
type Executor<T> = (resolve: (value: T) => void, reject: (reason?: any) => void) => void;

class MyPromise<T> {
  constructor(executor: Executor<T>)
  then<U>(onFulfilled?: (value: T) => U | MyPromise<U>, onRejected?: (reason: any) => U | MyPromise<U>): MyPromise<U>
  catch<U>(onRejected: (reason: any) => U | MyPromise<U>): MyPromise<U>
  static resolve<T>(value: T): MyPromise<T>
  static reject(reason: any): MyPromise<never>
}
```

---

## Examples

### Example 1
```typescript
new MyPromise((resolve) => resolve(42))
  .then((val) => val * 2)
  .then(console.log); // 84
```

### Example 2
```typescript
new MyPromise((_, reject) => reject("fail"))
  .catch((err) => console.log(err)); // "fail"
```

---

## Constraints

- Callbacks registered via `.then()` must be called asynchronously (use `setTimeout` or `queueMicrotask`)
- `.then()` must return a new `MyPromise` to support chaining
- If `onFulfilled` returns a `MyPromise`, the next `.then()` should wait for it

---

## Approach Hints

<details><summary>Hint 1</summary>
Track the promise state: pending, fulfilled, or rejected.
</details>

<details><summary>Hint 2</summary>
Store callbacks in arrays so multiple `.then()` calls on the same promise work.
</details>

<details><summary>Hint 3</summary>
In `.then()`, return a new `MyPromise` whose resolution depends on the callback result.
</details>

---

## Related Problems

- Implement Promise.all
- Implement Promise.any
- Implement Promise.race
