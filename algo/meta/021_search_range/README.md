# 021. Find First and Last Position of Element in Sorted Array (LeetCode 34)

**Difficulty:** Medium
**Topics:** Array, Binary Search

---

## Description

Given an array of integers `nums` sorted in **non-decreasing** order (duplicates
allowed) and a `target`, return `[first, last]` — the indices of the first and last
occurrence of `target`. If `target` does not occur, return `[-1, -1]`. The algorithm
must run in **O(log n)** time, even when `target` occurs a huge number of times.

## Examples

```ts
searchRange([5, 7, 7, 8, 8, 10], 8); // [3, 4]
searchRange([5, 7, 7, 8, 8, 10], 6); // [-1, -1]
searchRange([], 0); // [-1, -1]
```

## Constraints

- `0 <= nums.length <= 10^5`
- `-10^9 <= nums[i], target <= 10^9`
- `nums` is sorted in non-decreasing order.

## Target

O(log n) time, O(1) space: two binary searches — the lower bound of `target` and the
lower bound of `target + 1` (or an upper-bound search). The tests wrap the input in
a `Proxy` that counts element reads and require at most `4·log2(n) + 10` of them on
a 10^5-element array. "Binary-search once, then expand left and right" is O(n) when
the whole array equals `target`, and fails that test.

## Interviewer follow-up

- Write a single `lowerBound(nums, x)` helper and express both ends with it.
- Count occurrences of `target` in O(log n).
- What changes if the array is sorted in descending order, or you must return only the first index (`bisect_left`)?
