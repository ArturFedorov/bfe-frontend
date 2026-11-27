# 015. Buildings With an Ocean View (LeetCode 1762)

**Difficulty:** Medium
**Topics:** Array, Stack, Monotonic Stack

---

## Description

There are `n` buildings in a row; `heights[i]` is the height of building `i`. The
ocean lies to the **right** of the last building. A building has an ocean view if
**every** building to its right is **strictly shorter** than it. Return the indices
of all buildings with an ocean view, in **increasing** order.

## Examples

```ts
findBuildings([4, 2, 3, 1]); // [0, 2, 3]  (building 1 is blocked by building 2)
findBuildings([4, 3, 2, 1]); // [0, 1, 2, 3]
findBuildings([1, 3, 2, 4]); // [3]
findBuildings([2, 2, 2, 2]); // [3]  (equal height blocks the view)
```

## Constraints

- `1 <= heights.length <= 10^5`
- `1 <= heights[i] <= 10^9`

## Target

O(n) time, O(1) extra space beyond the output. The large-input test (10^5 elements)
will fail an O(n^2) "check everything to the right" approach.

## Interviewer follow-up

- Solve it with a single **left-to-right** pass (monotonic stack) — useful when the
  input is a stream and you can't scan from the end.
- Ocean on the left instead, or on both sides.
- Return the count only, or answer "can building i see the ocean?" for many queries.
