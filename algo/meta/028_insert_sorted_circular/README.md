# 028. Insert into a Sorted Circular Linked List (LeetCode 708)

**Difficulty:** Medium
**Topics:** Linked List, Two Pointers

---

## Description

You are given a reference to **some** node of a circular singly linked list
whose values are sorted in non-decreasing order when read around the circle
starting from the right place. The given node is not necessarily the smallest
one. Insert a new node with value `insertVal` so that the list stays a sorted
circular list, and return the reference you were given.

If several positions are valid (for example, the value equals existing values,
or all values are equal), any of them is acceptable. If the list is empty
(`head` is `null`), create a single node that points to itself and return it.

Nodes are `ListNode` from `../_shared/structures`; the last node's `next`
points back to the first.

## Examples

```ts
// Circle 3 -> 4 -> 1 -> (back to 3), head is the node 3
insert(head, 2); // returns head; circle now reads 3 -> 4 -> 1 -> 2 -> (3)

insert(null, 1); // a single node 1 whose next is itself

// Circle 1 -> (1), head is that node
insert(head, 0); // circle reads 1 -> 0 -> (1)  (rotation of [0, 1])
```

## Constraints

- `0 <=` number of nodes `<= 5 * 10^4` (tests use up to `10^5`)
- `-10^6 <= node.val, insertVal <= 10^6`
- Values may repeat; all nodes may hold the same value.

## Target

O(n) time, O(1) extra space — a single walk around the circle. The traps are
the **wrap point** (the max → min edge, where a new maximum or minimum
belongs) and a list where **every value is equal** (there is no wrap point,
so you must stop after one full lap instead of looping forever).

## Interviewer follow-up

- Return the new node instead of `head` — does anything else change?
- What if the list could be sorted in **descending** order, and you don't know which?
- Walk through the all-equal case: how do you guarantee termination without counting the length first?
