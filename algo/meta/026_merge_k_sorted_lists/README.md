# 026. Merge k Sorted Lists (LeetCode 23)

**Difficulty:** Hard
**Topics:** Linked List, Heap, Divide and Conquer, Merge Sort

---

## Description

You receive an array of `k` singly linked lists, each already sorted in
non-decreasing order (some entries may be `null`, meaning an empty list).
Merge them all into one sorted linked list and return its head. Reuse the
existing nodes — relinking them is enough; there is no need to allocate new
ones.

## Examples

```ts
listToArray(mergeKLists([buildList([1, 4, 5]), buildList([1, 3, 4]), buildList([2, 6])]));
// [1, 1, 2, 3, 4, 4, 5, 6]

mergeKLists([]); // null
mergeKLists([null]); // null
```

## Constraints

- `0 <= k <= 10^4`
- `0 <=` length of each list `<= 500`
- `-10^4 <= node.val <= 10^4`
- Each list is sorted in non-decreasing order.
- The total number of nodes `N` is at most `10^5` (tests go up to `10^5`).

## Target

O(N log k) time. Either keep a **min-heap of the k current heads** (O(k)
extra space; JS has no built-in heap, so write a small binary heap), or
**merge lists pairwise in rounds** like merge sort (log k rounds, each O(N)).
The large-input test (k = 1000 lists × 100 nodes) is about 10^8 steps for an
O(N · k) approach — merging lists into an accumulated result one at a time, or
scanning all k heads for the minimum on every step. That is noticeably slow
but may still pass in a fast JS engine, so treat O(N log k) as the bar you
must state and justify, not just "the test went green".

## Interviewer follow-up

- Compare heap vs pairwise divide-and-conquer: same complexity — which is easier to get right on a whiteboard, and which uses less memory?
- Merge k sorted **arrays** instead (return a new array) — what does the heap entry need to store now?
- What if the lists are streams too large to fit in memory (external merge)?
