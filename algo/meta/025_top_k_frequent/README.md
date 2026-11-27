# 025. Top K Frequent Elements (LeetCode 347)

**Difficulty:** Medium
**Topics:** Hash Table, Heap, Bucket Sort, Counting

---

## Description

Given an integer array `nums` and an integer `k`, return the `k` values that
occur most often in `nums`. The answer may be returned in **any order**. The
input is guaranteed to have a unique answer: there is never a tie at the
boundary between the `k`-th and `(k+1)`-th most frequent values.

## Examples

```ts
topKFrequent([1, 1, 1, 2, 2, 3], 2); // [1, 2]
topKFrequent([1], 1); // [1]
topKFrequent([4, 4, -1, -1, -1, 7], 1); // [-1]
```

## Constraints

- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`
- `1 <= k <=` number of distinct values in `nums`
- The answer is unique; output order does not matter.

## Target

Better than O(n log n). Two standard approaches:

- **Bucket sort** — O(n) time, O(n) space: count frequencies, then put each
  value into `buckets[freq]` (frequencies range over `1..n`) and walk buckets
  from high to low until `k` values are collected.
- **Min-heap of size k** — O(n log k) time, O(n) space: push `[value, freq]`
  pairs and pop whenever the heap exceeds `k`.

The large-input test (10^5 numbers, ~10^4 distinct) is comfortably fast for
both; a solution that rescans the array for every distinct value (O(n · d))
will be too slow.

## Interviewer follow-up

- Implement it with a heap, then with bucket sort — when is O(n log k) preferable to O(n)? (k tiny, values streaming in.)
- Quickselect on the distinct values: average O(n), worst O(n^2).
- Top K Frequent **Words** (LC 692): ties broken lexicographically, output sorted — what changes in the comparator?
