# 024. Double Booking

**Difficulty:** Very Easy
**Topics:** Intervals, Sorting, Calendars

---

## Description

A calendar service stores every meeting on a user's calendar as an interval of
minutes `{ start, end }`. Intervals are **half-open** — `[start, end)` — so a
meeting occupies `start` up to but **not including** `end`. Write a function
that reports whether the calendar contains a double-booking, i.e. any two
meetings that occupy at least one common minute. A meeting that ends at `10:00`
and another that starts at `10:00` share only a boundary, so they are **not** a
double-booking. The input list arrives in no particular order.

## Examples

```ts
hasDoubleBooking([
  { start: 0, end: 30 },
  { start: 45, end: 60 },
]); // false — no overlap

hasDoubleBooking([
  { start: 0, end: 30 },
  { start: 30, end: 60 },
]); // false — shared boundary is NOT a double-booking

hasDoubleBooking([
  { start: 0, end: 30 },
  { start: 15, end: 45 },
]); // true — minutes 15–29 are booked twice
```

## Constraints

- `0 <= meetings.length <= 100_000`
- `0 <= start < end <= 10^9` for every meeting
- Input is **unsorted** — do not assume any order
- Half-open semantics: `[a, b)` and `[b, c)` do not conflict
- Do not mutate the input array

## Target

O(n log n) time, O(1) extra space beyond the sort.

## Interviewer follow-up

How would you change the function to return the first conflicting **pair** of
meetings (by earliest overlap) instead of a boolean?
