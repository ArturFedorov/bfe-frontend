# 019. Find Peak Element (LeetCode 162)

**Difficulty:** Medium
**Topics:** Array, Binary Search

---

## Description

A **peak** is an element strictly greater than its neighbours. Given an integer array
`nums` in which no two adjacent elements are equal, return the index of **any** peak.
Treat the positions just outside the array as negative infinity, so `nums[0]` only
needs to beat `nums[1]`, and the last element only needs to beat the one before it.
A peak always exists. The algorithm must run in **O(log n)** time.

## Examples

```ts
findPeakElement([1, 2, 3, 1]); // 2  (nums[2] = 3)
findPeakElement([1, 2, 1, 3, 5, 6, 4]); // 1 or 5 (either peak is accepted)
findPeakElement([7]); // 0
```

## Constraints

- `1 <= nums.length <= 10^5` in the tests (LeetCode: `<= 1000`).
- `-2^31 <= nums[i] <= 2^31 - 1`
- `nums[i] !== nums[i + 1]` for every valid `i`.
- Any peak index is accepted — the tests check that the returned index is a peak.

## Target

O(log n) time, O(1) space. Compare `nums[mid]` with `nums[mid + 1]`: if the slope
goes up, a peak lies to the right; otherwise one lies at `mid` or to its left.
The tests wrap the input in a `Proxy` that counts element reads and require at most
`2·log2(n) + 5` of them on a 10^5-element array — a linear scan fails.

## Interviewer follow-up

- Why is a peak guaranteed to exist in the half you keep? Argue it from the -∞ boundaries.
- What breaks if adjacent elements may be equal? (Worst case becomes O(n).)
- 2D version (LC 1901 Find a Peak Element II) in O(m log n).
