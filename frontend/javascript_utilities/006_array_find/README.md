# 6. Implement Array.prototype.find and findIndex

**Difficulty:** Easy

**Topics:** Arrays, Searching, Callbacks

---

## Description

Implement your own versions of `Array.prototype.find` and `Array.prototype.findIndex`.

- `myFind` returns the first element in the array that satisfies the provided testing function, or `undefined` if no element matches.
- `myFindIndex` returns the index of the first element that satisfies the testing function, or `-1` if no element matches.

```typescript
function myFind<T>(arr: T[], callback: (value: T, index: number, array: T[]) => boolean): T | undefined
function myFindIndex<T>(arr: T[], callback: (value: T, index: number, array: T[]) => boolean): number
```

---

## Examples

### Example 1
```typescript
myFind([1, 2, 3, 4], (x) => x > 2);
// => 3

myFindIndex([1, 2, 3, 4], (x) => x > 2);
// => 2
```

---

## Constraints

- The callback receives `(value, index, array)`
- `myFind` returns `undefined` if no element matches
- `myFindIndex` returns `-1` if no element matches
- Should stop iterating once a match is found

---

## Approach Hints

<details><summary>Hint 1</summary>
Iterate through the array and call the callback for each element. Return early when you find a match.
</details>

<details><summary>Hint 2</summary>
For `myFind`, return the element itself. For `myFindIndex`, return the index.
</details>

<details><summary>Hint 3</summary>
Consider implementing `myFind` in terms of `myFindIndex` to avoid code duplication.
</details>
