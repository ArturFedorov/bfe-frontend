# 30. Implement Array.prototype.flat (Iterative)

**Difficulty:** Hard

**Topics:** JavaScript Utilities, Arrays, Stack, Iteration

---

## Description

Implement your own version of `Array.prototype.flat()` **without using recursion**. Use an iterative approach (e.g., a stack) to flatten a nested array up to the specified depth.

```typescript
function flatIterative(arr: any[], depth?: number): any[]
```

- If `depth` is not provided, it defaults to `1`.
- If `depth` is `0`, the array should be returned as-is (no flattening).
- If `depth` is `Infinity`, the array should be fully flattened.

---

## Examples

### Example 1
```typescript
flatIterative([1, [2, [3]]], 1); // [1, 2, [3]]
```

### Example 2
```typescript
flatIterative([1, [2, [3, [4]]]], 2); // [1, 2, 3, [4]]
```

### Example 3
```typescript
flatIterative([1, [2, [3, [4]]]], Infinity); // [1, 2, 3, 4]
```

---

## Constraints

- Must NOT use recursion — use an iterative approach (stack-based)
- Should handle `depth` of `0`, positive integers, and `Infinity`
- Empty arrays at any level should be handled gracefully
- Should produce the same results as the recursive version

---

## Approach Hints

<details><summary>Hint 1</summary>
Use a stack where each item is a tuple of `[element, currentDepth]`. Process elements from the stack iteratively.
</details>

<details><summary>Hint 2</summary>
When you pop an array from the stack and its depth is greater than 0, push its elements back onto the stack with `depth - 1`.
</details>

<details><summary>Hint 3</summary>
Since a stack reverses order, consider processing from right to left or reversing at the end to maintain the original element order.
</details>
