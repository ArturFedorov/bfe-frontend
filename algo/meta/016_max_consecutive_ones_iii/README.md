# 016. Max Consecutive Ones III (LeetCode 1004)

**Difficulty:** Medium
**Topics:** Array, Sliding Window

---

## Description

Given a binary array `nums` (only `0`s and `1`s) and an integer `k`, return the length
of the longest contiguous run of `1`s you can obtain if you are allowed to flip **at
most** `k` zeros to ones. Equivalently: the longest subarray containing at most `k`
zeros.

## Examples

```ts
longestOnes([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2);                   // 6
longestOnes([0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1], 3); // 10
longestOnes([0, 0, 0], 0);                                            // 0
```

## Constraints

- `1 <= nums.length <= 10^5`
- `nums[i]` is `0` or `1`
- `0 <= k <= nums.length`

## Target

O(n) time, O(1) space (sliding window). The large-input test (10^5 elements) will
fail an O(n^2) "try every start" approach.

## Interviewer follow-up

- Streaming input where you can't store the array: keep a queue of the last `k` zero positions.
- `k = 1` special case (LC 487) — and the variant where you must delete exactly one element (LC 1493).
- Generalise to "longest subarray with at most k elements not equal to the majority value" (LC 424-style).
