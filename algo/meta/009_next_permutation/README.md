# 009. Next Permutation (LeetCode 31)

**Difficulty:** Medium
**Topics:** Array, Two Pointers

---

## Description

Given an array of integers, rearrange it **in place** into the lexicographically next
greater ordering of the same values. If no greater ordering exists (the array is in
non-increasing order), rearrange it into the lowest possible ordering (ascending).
The function returns nothing; only the array is changed. Use O(1) extra memory.

## Examples

```ts
const a = [1, 2, 3];
nextPermutation(a); // a is now [1, 3, 2]

const b = [3, 2, 1];
nextPermutation(b); // b is now [1, 2, 3]  (wraps around to the smallest)

const c = [1, 1, 5];
nextPermutation(c); // c is now [1, 5, 1]
```

## Constraints

- `1 <= nums.length <= 10^5`
- `0 <= nums[i] <= 100` (duplicates allowed)
- Must modify `nums` in place; do not return a new array.

## Target

O(n) time, O(1) extra space. The large-input test (10^5 elements) rejects anything
that generates permutations or sorts repeatedly.

## Interviewer follow-up

- Implement `prevPermutation` (the lexicographically previous ordering) — mirror every comparison.
- Why is reversing the suffix enough, instead of sorting it?
- How would you produce the k-th next permutation without stepping k times?
