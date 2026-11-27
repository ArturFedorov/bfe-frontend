# 008. Maximum Swap (LeetCode 670)

**Difficulty:** Medium
**Topics:** Math, Greedy

---

## Description

You are given a non-negative integer `num`. You may swap **two digits** of its
decimal representation **at most once**. Return the largest number you can
obtain.

## Examples

```ts
maximumSwap(2736); // 7236  (swap 2 and 7)
maximumSwap(9973); // 9973  (already maximal — no swap)
maximumSwap(1993); // 9913  (swap the leading 1 with the LAST 9)
```

## Constraints

- `0 <= num <= 10^8`

## Target

O(d) time, O(1) extra space where `d` is the number of digits (at most 9) —
record the last index of each digit 0–9, then for each position from the left
look for a larger digit occurring later and swap with its **last** occurrence.
Input is tiny, so there is no large-input test; trying all O(d^2) swaps would
also pass, but the interviewer expects the greedy argument.

## Interviewer follow-up

- Why must you swap with the **last** occurrence of the larger digit (`1993`)?
- Return the **smallest** number instead — what extra rule do you need about leading zeros?
- Allow up to **k** swaps (backtracking / greedy with pruning; related: LC 1505).
