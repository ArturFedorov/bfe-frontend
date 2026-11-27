# 042. Nested List Weight Sum (LeetCode 339)

**Difficulty:** Medium
**Topics:** DFS, BFS, Recursion

---

## Description

You are given a nested list of integers. Each element is either an integer or
another list whose elements may themselves be integers or lists, to any depth.

The **depth** of an integer is the number of lists it sits inside: integers in
the top-level list have depth `1`, integers inside a list inside the top-level
list have depth `2`, and so on. Return the sum of every integer multiplied by
its depth.

> **Note:** LeetCode models the input with a `NestedInteger` interface
> (`isInteger()`, `getInteger()`, `getList()`). Here the input is a plain
> nested TypeScript array — `type NestedList = Array<number | NestedList>` —
> so use `Array.isArray` / `typeof x === 'number'` to tell the cases apart.

## Examples

```ts
depthSum([[1, 1], 2, [1, 1]]); // 10  (four 1s at depth 2, one 2 at depth 1)

depthSum([1, [4, [6]]]); // 27  (1*1 + 4*2 + 6*3)

depthSum([0]); // 0
```

## Constraints

- `1 <= nestedList.length <= 50`
- Integer values are in `[-100, 100]`.
- Maximum nesting depth is at most `50`.
- Empty inner lists (`[]`) are allowed and contribute nothing.

## Target

O(N) time where N is the total number of integers and lists; O(D) extra space
for the recursion stack (D = max depth), or O(width) for a BFS queue.

## Interviewer follow-up

- **LC 364 — Nested List Weight Sum II:** weights are inverted — an integer's weight is `maxDepth - depth + 1`, so the deepest integers count once and the top-level ones count the most. Can you do it in one pass without first computing `maxDepth`? (BFS: keep a running `unweighted` sum and add it to `total` after every level.)
- Rewrite your recursive DFS iteratively (explicit stack of `[list, depth]`) or as level-order BFS.
