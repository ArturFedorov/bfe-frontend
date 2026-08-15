# 009. Moving Average

**Difficulty:** Very Easy
**Topics:** Sliding Window, Streams, Running Sum

---

## Description

A CPU monitor samples utilization once per second and needs to display a smoothed value: the
average of the last `k` readings. Readings arrive one at a time through `next(reading)`, and the
monitor must return the updated moving average after every sample — including during warm-up, when
fewer than `k` readings have arrived (average over what exists so far). The monitor runs for hours,
so each call must do a constant amount of work; recomputing the sum of the whole window on every
sample is not acceptable.

## Examples

```ts
const avg = new MovingAverage(3);
avg.next(1);  // 1        (only one reading yet)
avg.next(5);  // 3        ((1 + 5) / 2)
avg.next(3);  // 3        ((1 + 5 + 3) / 3)
avg.next(7);  // 5        ((5 + 3 + 7) / 3 — the 1 fell out of the window)
```

## Constraints

- `k` is an integer `>= 1`; the constructor throws a `RangeError` otherwise (including non-integers).
- Readings are finite numbers; they may be negative or fractional.
- Before `k` readings have arrived, `next` returns the average of all readings seen so far.
- With `k = 1`, `next` returns the reading itself.
- The stream can exceed `100_000` readings.

## Target

O(1) per `next` call, O(k) space; recomputing the window sum each call (O(k) per call, O(n·k)
total) will fail the large-input test.

## Interviewer follow-up

Product now wants the moving **median** over the same window instead of the mean — why does your
running-sum trick stop working, and what structure would you reach for?
