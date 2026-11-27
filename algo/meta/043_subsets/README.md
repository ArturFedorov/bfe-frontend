# 043. Subsets (LeetCode 78)

**Difficulty:** Medium
**Topics:** Backtracking, Bit Manipulation, Array

---

## Description

Given an array `nums` of **distinct** integers, return every possible subset
(the power set), including the empty subset and `nums` itself. No subset may
appear twice. The subsets, and the elements within each subset, may be returned
in any order.

## Examples

```ts
subsets([1, 2, 3]);
// [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]  (any order)

subsets([0]);
// [[], [0]]
```

## Constraints

- `1 <= nums.length <= 10`
- `-10 <= nums[i] <= 10`
- All values in `nums` are distinct.
- Do not mutate `nums`.

## Target

O(n · 2^n) time and output space — there are `2^n` subsets of average length
`n/2`, so this is optimal. Backtracking (include / skip each index), iterative
doubling, or bitmask enumeration all meet it.

## Interviewer follow-up

- **LC 90 — Subsets II:** `nums` may contain duplicates; return no duplicate subsets. (Sort, then skip `nums[i] === nums[i - 1]` at the same recursion level.)
- Return only subsets of size `k` (LC 77 Combinations) or whose sum equals a target (LC 39/40).
- Write it iteratively with bitmasks, and explain why `n` must stay small.
