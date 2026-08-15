# 010. Busiest Period

**Difficulty:** Easy
**Topics:** Sliding Window, Arrays, Fixed Window

---

## Description

A traffic dashboard shows request counts per hour as an array, where `requests[i]` is the number
of requests received in hour `i`. Capacity planning wants to know the busiest stretch of the day:
the block of `k` consecutive hours with the highest total number of requests. Return the starting
index of that block; when several blocks tie for the highest total, return the earliest one. The
dashboard covers long retention windows, so the scan must be a single pass — re-summing every
candidate window is too slow.

## Examples

```ts
busiestPeriod([3, 1, 4, 1, 5, 9, 2, 6], 3); // 5  (9 + 2 + 6 = 17)
busiestPeriod([10, 2, 2, 10], 2);           // 0  (ties at 12: starts 0 and 2 — earliest wins)
busiestPeriod([7, 7, 7], 3);                // 0  (the whole array is the only window)
```

## Constraints

- `requests.length` is between `0` and `100_000`; counts are non-negative integers.
- `k` must be an integer with `1 <= k <= requests.length`; otherwise throw a `RangeError`
  (this includes an empty array, since no valid `k` exists for it).
- Ties on the window sum resolve to the smallest starting index.
- `k = requests.length` returns `0`.

## Target

O(n) time, O(1) extra space — one pass with a rolling sum; O(n·k) re-summing will fail the
large-input test.

## Interviewer follow-up

The dashboard now needs the busiest period for many different `k` values (1h, 6h, 24h) over the
same data, answered repeatedly — what would you precompute, and what does each query cost then?
