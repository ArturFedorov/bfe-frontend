# 014. Dot Product of Two Sparse Vectors (LeetCode 1570)

**Difficulty:** Medium
**Topics:** Array, Hash Map, Two Pointers, Design

---

## Description

Implement a class `SparseVector` that is constructed from a dense integer array `nums`
(mostly zeros) and stores it **compactly** — only the non-zero entries. Its method
`dotProduct(other)` returns the dot product `sum(a[i] * b[i])` of this vector and
another `SparseVector` of the same length. Work proportional to the number of
non-zero entries, not the dense length.

## Examples

```ts
const a = new SparseVector([1, 0, 0, 2, 3]);
const b = new SparseVector([0, 3, 0, 4, 0]);
a.dotProduct(b); // 8  (2 * 4)

new SparseVector([0, 1, 0, 0, 0]).dotProduct(new SparseVector([0, 0, 0, 0, 2])); // 0

new SparseVector([0, 1, 0, 0, 2, 0, 0]).dotProduct(new SparseVector([1, 0, 0, 0, 3, 0, 4])); // 6
```

## Constraints

- `1 <= nums.length <= 10^5`
- `0 <= nums[i] <= 100` (tests also use negatives)
- Both vectors in a `dotProduct` call have the same length.

## Target

O(n) construction; `dotProduct` in O(L1 + L2) (two-pointer merge over sorted index
lists) or O(min(L1, L2)) (iterate the smaller hash map), where L is the non-zero
count. O(L) space per vector. The large test calls `dotProduct` many times on
10^5-length vectors with few non-zeros — iterating the dense length each time will
time out.

## Interviewer follow-up

- Hash map vs. sorted (index, value) pairs: which do you pick, and why do interviewers
  push back on hashing (hash cost, poor locality for large sparse data)?
- What if only one vector is sparse? Iterate the sparse one and binary-search the other's index list: O(L1 log L2).
- How would you store and multiply vectors that don't fit in memory?
