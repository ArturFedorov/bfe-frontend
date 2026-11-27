# 024. K Closest Points to Origin (LeetCode 973)

**Difficulty:** Medium
**Topics:** Array, Heap (Priority Queue), Quickselect, Geometry

---

## Description

Given an array of points `points[i] = [xi, yi]` on the plane and an integer `k`,
return the `k` points closest to the origin `(0, 0)` by Euclidean distance. The
answer may be returned in **any order**, and the inputs are chosen so the set of `k`
closest points is unique (no tie at the cut-off).

## Examples

```ts
kClosest([[1, 3], [-2, 2]], 1);
// [[-2, 2]]   (distances: √10 vs √8)

kClosest([[3, 3], [5, -1], [-2, 4]], 2);
// [[3, 3], [-2, 4]]   (any order)
```

## Constraints

- `1 <= k <= points.length <= 10^5`
- `-10^4 <= xi, yi <= 10^4`
- The answer is unique up to order. Do not mutate `points` or the point arrays
  inside it (copying is fine).

## Target

Either of:

- **Max-heap of size k** keyed by squared distance — O(n log k) time, O(k) space.
  JS has no built-in heap: write a small binary heap. Compare `x² + y²`, never
  `Math.sqrt`.
- **Quickselect** on squared distance — average O(n) time (on a copy, since the input
  must not be mutated).

Sorting all points (O(n log n)) passes the 10^5-point test but is the baseline the
interviewer expects you to improve on.

## Interviewer follow-up

- Points arrive as a stream that never ends: which approach still works, and what is its memory?
- Why a **max**-heap of size k rather than a min-heap of all n points? Compare both costs.
- Return the result sorted by distance — what does that cost on top of each approach?
