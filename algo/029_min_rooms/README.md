# 029. Minimum Meeting Rooms

**Difficulty:** Medium
**Topics:** Intervals, Sweep Line, Heaps

---

## Description

An office booking system must report how many meeting rooms the building needs
so that every scheduled meeting gets a room. Meetings are intervals of minutes
`{ start, end }` with half-open `[start, end)` semantics: a meeting ending at
`10:00` and another starting at `10:00` can share a room. The answer is the
maximum number of meetings in progress at any single minute. The input list is
unsorted. Classic approaches are a sweep line over sorted start/end events or a
min-heap of end times — pick one and be ready to explain the other.

## Examples

```ts
minRooms([]); // 0

minRooms([
  { start: 0, end: 30 },
  { start: 30, end: 60 },
]); // 1 — back-to-back meetings reuse the room

minRooms([
  { start: 0, end: 30 },
  { start: 5, end: 10 },
  { start: 15, end: 20 },
]); // 2 — the long meeting overlaps each short one
```

## Constraints

- `0 <= meetings.length <= 100_000`
- `0 <= start < end <= 10^9`
- Input is **unsorted**
- Half-open semantics: a shared boundary (`end === next.start`) needs no extra room — when a start and an end fall on the same minute, the room frees up first
- Do not mutate the input array

## Target

O(n log n) time, O(n) space.

## Interviewer follow-up

The facilities team also wants to know **which room** each meeting should use
(rooms numbered from 0). How does your chosen approach extend to produce an
assignment, and does the room count stay optimal?
