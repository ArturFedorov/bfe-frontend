# 022. Calendar Intersection

**Difficulty:** Medium
**Topics:** Two Pointers, Intervals, Calendars

---

## Description

A meeting scheduler needs to know when **both** people are busy at the same time — for example, to
flag slots that can never host a meeting. Each person's calendar is a list of busy intervals,
sorted by start time and non-overlapping within one calendar. Walk both calendars with one pointer
each and emit every overlapping slot: the intersection starts at the later of the two starts and
ends at the earlier of the two ends. Only overlaps with positive duration count — two intervals
that merely touch at an endpoint (one ends exactly when the other starts) share no actual time.

## Examples

```ts
calendarIntersection(
  [{ start: 0, end: 30 }, { start: 60, end: 90 }],
  [{ start: 20, end: 70 }],
);
// [{ start: 20, end: 30 }, { start: 60, end: 70 }]

calendarIntersection([{ start: 0, end: 10 }], [{ start: 10, end: 20 }]);
// [] — touching endpoints share no time

calendarIntersection([], [{ start: 5, end: 9 }]); // []
```

## Constraints

- Each calendar has between `0` and `100_000` intervals.
- Intervals satisfy `start < end`; times are non-negative integers (minutes since midnight, say).
- Within one calendar, intervals are sorted by `start` and do not overlap each other.
- Output intervals must be sorted by `start` and have positive duration (`start < end`); touching
  endpoints produce no output.
- Return a new array of new interval objects; do not mutate the inputs.
- Do not concatenate-and-sort — the linear pointer walk is the point.

## Target

O(n + m) time, output-sized space.

## Interviewer follow-up

Now k team members need the slots where **everyone** is busy simultaneously — how do you extend the
two-pointer walk, and is intersecting calendars pairwise better or worse than a k-way sweep?
