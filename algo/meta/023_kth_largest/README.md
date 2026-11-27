# 023. Kth Largest Element in an Array (LeetCode 215)

**Difficulty:** Medium
**Topics:** Array, Quickselect, Heap (Priority Queue), Divide and Conquer

---

## Description

Given an integer array `nums` and an integer `k`, return the `k`-th largest element
in **sorted order** — not the `k`-th distinct value. For example, in `[3, 3, 2]` the
1st and 2nd largest are both `3`. Solve it without fully sorting the array.

The function **may reorder `nums` in place** (as LeetCode allows) — callers must not
rely on the input order afterwards. It must not add or remove elements.

## Examples

```ts
findKthLargest([3, 2, 1, 5, 6, 4], 2); // 5
findKthLargest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4); // 4
findKthLargest([1], 1); // 1
```

## Constraints

- `1 <= k <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`

## Target

Either of:

- **Quickselect** — average O(n) time, O(1) extra space. Use a random pivot and a
  three-way (or Hoare) partition: a fixed pivot is O(n²) on sorted input, and a
  two-way Lomuto partition is O(n²) when all elements are equal.
- **Min-heap of size k** — O(n log k) time, O(k) space. JS has no built-in heap:
  write a small binary heap.

The large-input tests (10^5 elements: sorted, reverse-sorted, all equal) must each
finish in under 1 s, which fails the degenerate quickselect variants above. A plain
`sort` passes the clock but is the answer the interviewer will push you past.

## Interviewer follow-up

- Compare quickselect and the size-k heap: which do you pick for a stream of numbers, and which if `k` is close to `n`?
- Counting sort over the value range (`-10^4 … 10^4`) gives O(n + range) — when is that legitimate?
- Kth Largest Element in a Stream (LC 703): maintain the answer as numbers arrive.
