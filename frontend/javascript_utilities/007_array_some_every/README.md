# 7. Implement Array.prototype.some and every

**Difficulty:** Easy

**Topics:** Arrays, Short-Circuit Evaluation, Callbacks

---

## Description

Implement your own versions of `Array.prototype.some` and `Array.prototype.every`.

- `mySome` tests whether at least one element in the array passes the test. Returns `false` for an empty array.
- `myEvery` tests whether all elements in the array pass the test. Returns `true` for an empty array (vacuous truth).

Both should short-circuit: `mySome` stops on the first `true`, `myEvery` stops on the first `false`.

```typescript
function mySome<T>(arr: T[], callback: (value: T, index: number, array: T[]) => boolean): boolean
function myEvery<T>(arr: T[], callback: (value: T, index: number, array: T[]) => boolean): boolean
```

---

## Examples

### Example 1
```typescript
mySome([1, 2, 3], (x) => x > 2);  // => true
mySome([1, 2, 3], (x) => x > 5);  // => false

myEvery([2, 4, 6], (x) => x % 2 === 0);  // => true
myEvery([2, 3, 6], (x) => x % 2 === 0);  // => false
```

---

## Constraints

- The callback receives `(value, index, array)`
- `mySome` returns `false` for an empty array
- `myEvery` returns `true` for an empty array
- Both must short-circuit when the result is determined

---

## Approach Hints

<details><summary>Hint 1</summary>
For `mySome`, iterate and return `true` as soon as any callback returns `true`.
</details>

<details><summary>Hint 2</summary>
For `myEvery`, iterate and return `false` as soon as any callback returns `false`.
</details>

<details><summary>Hint 3</summary>
The empty array behavior follows from the loop never executing: `mySome` defaults to `false`, `myEvery` defaults to `true`.
</details>
