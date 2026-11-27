# 027. Copy List with Random Pointer (LeetCode 138)

**Difficulty:** Medium
**Topics:** Linked List, Hash Table

---

## Description

Each node of a singly linked list has a `val`, a `next` pointer, and an extra
`random` pointer that may point to any node in the same list or be `null`.
Return a **deep copy** of the list: a brand-new set of nodes, one per original
node, with the same values, where every copied `next` and `random` points to
the corresponding **copied** node. No pointer in the copy may refer to a node
of the original list, and the original list must be left exactly as it was.

Lists are described in examples as `[[val, randomIndex], ...]`, where
`randomIndex` is the 0-based position of the node `random` points to, or
`null`.

## Examples

```ts
// [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]]
const copy = copyRandomList(head);
// copy has the same shape: 7 -> 13 -> 11 -> 10 -> 1,
// with copy.next.random === copy, etc. — and no node shared with `head`.

copyRandomList(null); // null
```

## Constraints

- `0 <=` list length `<= 10^5` (tests use up to `10^5`)
- `-10^4 <= node.val <= 10^4`
- `random` is `null` or points to a node of the same list (possibly the node itself).

## Target

O(n) time. The hash-map approach (original node → copy) uses O(n) extra
space; the interleaving trick (insert each copy right after its original,
wire `random` via `orig.random.next`, then unweave) uses O(1) extra space.
Keep it iterative — the large-input test (10^5 nodes) will overflow the stack
of a recursive "copy(node) = new node + copy(node.next)" solution.

## Interviewer follow-up

- Do it in O(1) extra space (interleave copies into the original list, then split it back — and restore the original!).
- Clone a general graph (LC 133 Clone Graph) — what changes when there is no `next` chain to walk?
- Why must you restore the original list in the interleaving approach, and how would a test detect that you didn't?
