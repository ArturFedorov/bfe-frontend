# 011. Subarray Sum Equals K (LeetCode 560)

**Difficulty:** Medium
**Topics:** Array, Hash Map, Prefix Sum

---

## Description

Given an integer array `nums` and an integer `k`, return how many **contiguous,
non-empty** subarrays have elements summing to exactly `k`. Values may be negative or
zero, so the window can't simply be grown and shrunk.

## Examples

```ts
subarraySum([1, 1, 1], 2);   // 2  ([1,1] at 0..1 and 1..2)
subarraySum([1, 2, 3], 3);   // 2  ([1,2] and [3])
subarraySum([1, -1, 0], 0);  // 3  ([1,-1], [1,-1,0], [0])
```

## Constraints

- `1 <= nums.length <= 2 * 10^4` (tests go up to 10^5)
- `-1000 <= nums[i] <= 1000`
- `-10^7 <= k <= 10^7`

## Target

O(n) time, O(n) space. The large-input test (10^5 elements) will fail the O(n^2)
all-pairs approach.

## Interviewer follow-up

- If all numbers are positive, solve it in O(1) space (sliding window).
- Return whether **any** such subarray exists, or return the indices of one.
- Why must the map be seeded with `{0: 1}` before the loop?
