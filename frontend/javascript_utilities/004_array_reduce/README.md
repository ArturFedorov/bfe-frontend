# 4. Implement Array.prototype.reduce

**Difficulty:** Medium

**Topics:** Arrays, Higher-Order Functions, Accumulators

---

## Description

Implement your own version of `Array.prototype.reduce`. The function should execute a reducer callback on each element of the array, resulting in a single output value.

Your `myReduce` function should:
1. Accept an optional initial value
2. If no initial value is provided, use the first element as the initial accumulator and start iteration from the second element
3. Throw a `TypeError` if the array is empty and no initial value is provided
4. Pass `(accumulator, value, index, array)` to the callback

```typescript
function myReduce<T, U>(arr: T[], callback: (accumulator: U, value: T, index: number, array: T[]) => U, initialValue?: U): U
```

---

## Examples

### Example 1
```typescript
myReduce([1, 2, 3, 4], (acc, val) => acc + val, 0);
// => 10
```

### Example 2
```typescript
myReduce(["a", "b", "c"], (acc, val) => acc + val, "");
// => "abc"
```

---

## Constraints

- If no `initialValue` is supplied and the array is empty, throw a `TypeError`
- If no `initialValue` is supplied, the first element is used as the initial accumulator
- The callback receives `(accumulator, value, index, array)`
- The original array must not be mutated

---

## Approach Hints

<details><summary>Hint 1</summary>
Handle the two cases separately: with and without an initial value. When there's no initial value, start the accumulator with `arr[0]` and begin the loop at index 1.
</details>

<details><summary>Hint 2</summary>
Don't forget to throw a TypeError when the array is empty and no initial value is provided.
</details>

<details><summary>Hint 3</summary>
The callback's index parameter should reflect the actual index in the original array, not the iteration count.
</details>
