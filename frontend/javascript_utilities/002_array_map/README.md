# 2. Implement Array.prototype.map

**Difficulty:** Easy

**Topics:** Arrays, Higher-Order Functions, Callbacks

---

## Description

Implement your own version of `Array.prototype.map`. The function should create a new array populated with the results of calling a provided callback function on every element in the input array.

Your `myMap` function should:
1. Call the callback with each element's value, index, and the original array
2. Return a new array containing the callback's return values
3. Not mutate the original array

```typescript
function myMap<T, U>(arr: T[], callback: (value: T, index: number, array: T[]) => U): U[]
```

---

## Examples

### Example 1
```typescript
myMap([1, 2, 3], (x) => x * 2);
// => [2, 4, 6]
```

### Example 2
```typescript
myMap(["a", "b", "c"], (val, idx) => `${idx}:${val}`);
// => ["0:a", "1:b", "2:c"]
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
For each element, call the callback with the value, index, and original array, then push the result.
</details>

<details><summary>Hint 3</summary>
Consider how to handle sparse arrays — should you skip holes or include `undefined`?
</details>
