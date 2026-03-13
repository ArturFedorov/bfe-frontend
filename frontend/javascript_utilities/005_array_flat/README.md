# 5. Implement Array.prototype.flat

**Difficulty:** Medium

**Topics:** Arrays, Recursion, Depth Control

---

## Description

Implement your own version of `Array.prototype.flat`. The function should create a new array with all sub-array elements concatenated into it recursively up to the specified depth.

Your `myFlat` function should:
1. Default to depth 1 if no depth is provided
2. Flatten nested arrays up to the given depth
3. Return a shallow copy when depth is 0
4. Handle `Infinity` as a depth value

```typescript
function myFlat(arr: any[], depth?: number): any[]
```

---

## Examples

### Example 1
```typescript
myFlat([1, [2, 3], [4, [5]]]);
// => [1, 2, 3, 4, [5]]
```

### Example 2
```typescript
myFlat([1, [2, [3, [4]]]], Infinity);
// => [1, 2, 3, 4]
```

---

## Constraints

- Default depth is 1
- Depth of 0 returns a shallow copy of the array
- Must handle `Infinity` depth
- Must not mutate the original array

---

## Approach Hints

<details><summary>Hint 1</summary>
Use recursion: for each element, if it's an array and depth > 0, recurse with depth - 1.
</details>

<details><summary>Hint 2</summary>
The base case is when depth reaches 0 — just copy elements as-is.
</details>

<details><summary>Hint 3</summary>
You can also solve this iteratively using a stack or queue with `[element, depth]` pairs.
</details>
