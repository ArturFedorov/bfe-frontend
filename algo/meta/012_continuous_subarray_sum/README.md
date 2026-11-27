# 012. Continuous Subarray Sum (LeetCode 523)

**Difficulty:** Medium
**Topics:** Array, Hash Map, Prefix Sum, Modular Arithmetic

---

## Description

Given a non-negative integer array `nums` and a positive integer `k`, return `true` if
there is a contiguous subarray of **length at least 2** whose sum is a multiple of `k`
(that is, `sum = n * k` for some integer `n >= 0`; zero counts as a multiple of every
`k`). Otherwise return `false`.

## Examples

```ts
checkSubarraySum([23, 2, 4, 6, 7], 6);  // true   ([2, 4] sums to 6)
checkSubarraySum([23, 2, 6, 4, 7], 6);  // true   (whole array sums to 42)
checkSubarraySum([23, 2, 6, 4, 7], 13); // false
```

## Constraints

- `1 <= nums.length <= 10^5`
- `0 <= nums[i] <= 10^9`
- `0 <= sum(nums) <= 2^31 - 1`
- `1 <= k <= 2^31 - 1`

## Target

O(n) time, O(min(n, k)) space. The large-input test (10^5 elements) will fail an
O(n^2) scan of all subarrays.

## Interviewer follow-up

- Why store the **earliest** index of each remainder, and why seed it with `{0: -1}`?
- What changes if `k` may be 0 or negative, or `nums` may contain negatives?
- Return the bounds of the shortest qualifying subarray instead of a boolean.
