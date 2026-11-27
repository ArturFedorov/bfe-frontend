# 020. Kth Missing Positive Number (LeetCode 1539)

**Difficulty:** Easy
**Topics:** Array, Binary Search

---

## Description

You are given an array `arr` of positive integers sorted in **strictly increasing**
order, and an integer `k`. Consider the positive integers `1, 2, 3, …` that do **not**
appear in `arr`. Return the `k`-th of them (1-based).

## Examples

```ts
findKthPositive([2, 3, 4, 7, 11], 5); // 9   (missing: 1, 5, 6, 8, 9, 10, 12, …)
findKthPositive([1, 2, 3, 4], 2); // 6   (missing: 5, 6, 7, …)
findKthPositive([5, 6, 7], 3); // 3   (missing: 1, 2, 3, 4, 8, …)
```

## Constraints

- `0 <= arr.length <= 10^5` in the tests (LeetCode: `1 <= arr.length <= 1000`).
- `1 <= arr[i] <= 10^9`, `arr[i] < arr[i + 1]`.
- `1 <= k <= 10^9`.

## Target

O(log n) time, O(1) space. The number of positives missing before index `i` is
`arr[i] - (i + 1)`. Binary-search for the first index `lo` where that count is
`>= k`; the answer is `lo + k`. The tests wrap the input in a `Proxy` that counts
element reads and require at most `2·log2(n) + 5` of them on a 10^5-element array —
the O(n) linear scan (the usual first answer) fails.

## Interviewer follow-up

- Start with the O(n) walk, then: "the array is sorted — can you do better?" (this is the expected arc).
- Missing Element in Sorted Array (LC 1060): same idea, but counting starts from `arr[0]` instead of 1.
- What if `arr` may contain duplicates?
