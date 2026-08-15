# 006. Image Row Rotate

**Difficulty:** Medium
**Topics:** Arrays, In-Place Algorithms, Reversal Trick

---

## Description

An image editor implements a "shift row" tool: a row of pixel values slides
left or right by `k` positions and the pixels that fall off one edge wrap
around to the other. The rows are large and the editor works on them in place —
you may not allocate a second row. Implement `rotateRow(pixels, k, direction)`:
it mutates the given array (returning nothing) using O(1) extra space. The
classic approach is the three-reversal trick: reverse parts, then reverse the
whole.

## Examples

```ts
const row = [1, 2, 3, 4, 5];
rotateRow(row, 2, 'left');
row; // [3, 4, 5, 1, 2]

const row2 = [1, 2, 3, 4, 5];
rotateRow(row2, 2, 'right');
row2; // [4, 5, 1, 2, 3]

const row3 = [1, 2, 3];
rotateRow(row3, 5, 'left'); // k wraps: 5 % 3 === 2
row3; // [3, 1, 2]
```

## Constraints

- `k` must be a non-negative integer; throw `RangeError` otherwise (before touching the array).
- `k` may be larger than the row length (wraps via modulo) — including very large values like `10 ** 9`.
- Empty rows and single-pixel rows are valid and unchanged by any rotation.
- The function mutates the input array and returns `undefined`.
- Pixel values may repeat.

## Target

O(n) time and O(1) extra space (reversal trick); rotating one step at a time
(O(n·k)) will fail both the huge-k test and the 100k large-input test.

## Interviewer follow-up

Millions of rotate operations on the same row arrive before anyone reads it —
how do you make the total cost O(n) instead of O(n) per operation?
