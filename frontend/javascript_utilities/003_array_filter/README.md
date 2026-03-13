# 3. Implement Array.prototype.filter

**Difficulty:** Easy

**Topics:** Arrays, Higher-Order Functions, Callbacks

---

## Description

Implement your own version of `Array.prototype.filter`. The function should create a new array with all elements that pass the test implemented by the provided callback function.

Your `myFilter` function should:
1. Call the callback with each element's value, index, and the original array
2. Include the element in the result only if the callback returns a truthy value
3. Not mutate the original array

```typescript
function myFilter<T>(arr: T[], callback: (value: T, index: number, array: T[]) => boolean): T[]
```

---

## Examples

### Example 1
```typescript
myFilter([1, 2, 3, 4, 5], (x) => x > 3);
// => [4, 5]
```

### Example 2
```typescript
myFilter(["apple", "banana", "cherry"], (s) => s.length > 5);
// => ["banana", "cherry"]
```

---

## Constraints

- The callback receives `(value, index, array)`
- The original array must not be mutated
- Should handle empty arrays
- Should handle sparse arrays

---

## Approach Hints

<details><summary>Hint 1</summary>
Create a new result array and iterate through each element of the input array.
</details>

<details><summary>Hint 2</summary>
For each element, call the callback — if it returns true, push the element to the result.
</details>

<details><summary>Hint 3</summary>
Be careful with sparse arrays: the native `filter` skips holes (empty slots).
</details>
