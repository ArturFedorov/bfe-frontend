# 044. Permutations (LeetCode 46)

**Difficulty:** Medium
**Topics:** Backtracking, Array

---

## Description

Given an array `nums` of **distinct** integers, return every possible ordering
(permutation) of its elements. The permutations may be returned in any order.

## Examples

```ts
permute([1, 2, 3]);
// [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]  (any order)

permute([0, 1]);
// [[0, 1], [1, 0]]

permute([1]);
// [[1]]
```

## Constraints

- `1 <= nums.length <= 6`
- `-10 <= nums[i] <= 10`
- All values in `nums` are distinct.
- Do not mutate `nums` (or restore it before returning).

## Target

O(n · n!) time and output space — there are `n!` permutations of length `n`,
so this is optimal. Backtrack with a `used` array, or swap elements in place
on a copy.

## Interviewer follow-up

- **LC 47 — Permutations II:** `nums` may contain duplicates; return only unique permutations. (Sort, then skip `nums[i]` if it equals `nums[i - 1]` and `nums[i - 1]` is not currently used.)
- Generate the permutations lazily with a generator, or produce only the next one (LC 31 Next Permutation).
- Compare the `used[]` approach with in-place swapping: space, ordering of output, and readability.
