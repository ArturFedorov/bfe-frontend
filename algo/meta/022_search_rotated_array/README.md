# 022. Search in Rotated Sorted Array (LeetCode 33)

**Difficulty:** Medium
**Topics:** Array, Binary Search

---

## Description

An array of **distinct** integers was sorted in ascending order and then possibly
rotated at an unknown pivot `p`: `[a0, a1, …, an-1]` became
`[ap, …, an-1, a0, …, ap-1]` (rotation by 0 leaves it unchanged). Given the rotated
array `nums` and a `target`, return the index of `target`, or `-1` if it is absent.
The algorithm must run in **O(log n)** time.

## Examples

```ts
search([4, 5, 6, 7, 0, 1, 2], 0); // 4
search([4, 5, 6, 7, 0, 1, 2], 3); // -1
search([1], 0); // -1
```

## Constraints

- `0 <= nums.length <= 10^5` in the tests (LeetCode: `1 <= nums.length <= 5000`).
- `-10^9 <= nums[i], target <= 10^9`
- All values in `nums` are distinct.
- `nums` is an ascending array rotated by some `0 <= p < n`.

## Target

O(log n) time, O(1) space, one pass: at every `mid`, at least one of `[lo, mid]` and
`[mid, hi]` is sorted — check whether `target` lies inside that sorted half's range
and discard the other half accordingly. (Finding the pivot first, then binary
searching one side, is also fine.) The tests wrap the input in a `Proxy` that counts
element reads and require at most `6·log2(n) + 10` of them on a 10^5-element array —
`indexOf` or any linear scan fails.

## Interviewer follow-up

- Duplicates allowed (LC 81 Search in Rotated Sorted Array II): what is the worst case now, and why?
- Find the minimum / the rotation index (LC 153 Find Minimum in Rotated Sorted Array).
- Can you do it with exactly one binary search, not "find pivot + search"?
