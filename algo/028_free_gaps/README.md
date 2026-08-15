# 028. Free Gaps

**Difficulty:** Medium
**Topics:** Intervals, Merging, Complement

---

## Description

A scheduling assistant needs to offer meeting slots. Given a person's booked
slots (unsorted, possibly overlapping or nested) and their working hours as a
single interval, return every **free gap inside working hours** that is at
least `minMinutes` long — the inverse of merging. All intervals are minutes
with half-open `[start, end)` semantics: back-to-back bookings leave no gap.
Bookings may stick out past working hours or lie entirely outside them; only
the portion inside working hours blocks free time. The result is sorted by
`start` and gaps of length exactly `minMinutes` count.

## Examples

```ts
freeGaps(
  [{ start: 60, end: 120 }, { start: 300, end: 360 }],
  { start: 0, end: 480 },
  30
);
// [ { start: 0, end: 60 }, { start: 120, end: 300 }, { start: 360, end: 480 } ]

freeGaps(
  [{ start: 0, end: 240 }, { start: 240, end: 480 }],
  { start: 0, end: 480 },
  1
); // [] — back-to-back bookings, no free time

freeGaps([], { start: 540, end: 1020 }, 60);
// [ { start: 540, end: 1020 } ] — empty calendar: the whole day is one gap
```

## Constraints

- `0 <= booked.length <= 100_000`; `booked` is **unsorted** and slots may overlap or nest
- `0 <= hours.start < hours.end <= 10^9`; `minMinutes >= 1`
- Bookings may extend beyond `hours` or fall entirely outside — clamp to working hours
- A gap qualifies when `end - start >= minMinutes` (exact `minMinutes` counts)
- Half-open semantics: touching bookings produce no zero-length gaps
- Return a new array; do not mutate the inputs

## Target

O(n log n) time, O(n) space.

## Interviewer follow-up

How would you extend this to working hours that repeat daily over a week,
where bookings can cross midnight?
