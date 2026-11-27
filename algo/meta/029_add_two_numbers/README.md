# 029. Add Two Numbers (LeetCode 2)

**Difficulty:** Medium
**Topics:** Linked List, Math, Simulation

---

## Description

Two non-negative integers are stored as linked lists of decimal digits in
**reverse order**: the head holds the ones digit, the next node the tens
digit, and so on. Return their sum as a linked list in the same reversed
format. Neither number has leading zeros, except the number `0` itself, which
is the single-node list `[0]`.

## Examples

```ts
listToArray(addTwoNumbers(buildList([2, 4, 3]), buildList([5, 6, 4])));
// [7, 0, 8]   (342 + 465 = 807)

listToArray(addTwoNumbers(buildList([0]), buildList([0])));
// [0]

listToArray(addTwoNumbers(buildList([9, 9, 9, 9]), buildList([9, 9])));
// [8, 9, 0, 0, 1]   (9999 + 99 = 10098)
```

## Constraints

- Each list has between `1` and `100` nodes per LeetCode (tests go up to `10^5`).
- `0 <= node.val <= 9`
- Neither number has leading zeros (other than `0` itself).

## Target

O(max(m, n)) time, O(1) extra space besides the output list. Walk both lists
together with a carry, as in grade-school addition. Do **not** convert to a
JS `number` (or even `BigInt` and back) — the lists can be far longer than 15
digits; tests include numbers with 10^5 digits, which also catches a recursive
solution that would overflow the stack.

## Interviewer follow-up

- Digits stored in **forward** order (LC 445 Add Two Numbers II) — without reversing the input lists? (Use two stacks.)
- Add two numbers given as **strings** (LC 415 Add Strings) — same carry loop over indices.
- Can you do it in place, reusing the longer input list's nodes?
