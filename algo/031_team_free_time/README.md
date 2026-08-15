# 031. Team Free Time

**Difficulty:** Hard
**Topics:** Intervals, K-way Merge, Complement

---

## Description

A meeting scheduler must find time slots where an **entire team** is free.
Input is one calendar per member: each calendar is a list of busy intervals in
minutes, already sorted by `start` and disjoint within that member (half-open
`[start, end)` semantics). Return every gap during which **no member is busy**,
bounded by the team's activity: report only finite gaps that lie strictly
between the earliest busy start and the latest busy end across all members —
the unbounded free time before anyone's first meeting or after everyone's last
is not reported. Consistent with 026, busy blocks that merely touch
(`[1, 3)` then `[3, 5)`, even across different members) leave no gap between
them. Members with empty calendars impose no constraints; if every calendar is
empty there is nothing to bound the day, so return `[]`.

## Examples

```ts
teamFreeTime([
  [{ start: 1, end: 3 }, { start: 6, end: 7 }],
  [{ start: 2, end: 4 }],
  [{ start: 9, end: 12 }],
]);
// [ { start: 4, end: 6 }, { start: 7, end: 9 } ]

teamFreeTime([
  [{ start: 1, end: 3 }],
  [{ start: 3, end: 5 }],
]); // [] — blocks touch across members, no usable gap

teamFreeTime([[{ start: 0, end: 10 }], []]);
// [] — one busy block bounds nothing; the empty calendar adds no constraint
```

## Constraints

- `0 <= calendars.length <= 1000`; total intervals across all calendars `<= 100_000`
- Each member's calendar is sorted by `start` with disjoint intervals; different members' intervals overlap freely
- `0 <= start < end <= 10^9`
- Only finite gaps between the global earliest busy start and latest busy end count; zero-length gaps (touching blocks) are excluded
- Return a new array sorted by `start`; do not mutate the inputs

## Target

O(n log n) time over n total intervals (O(n log k) with a k-way heap merge is the stretch goal).

## Interviewer follow-up

Your solution likely flattens all calendars and sorts. How would you instead
exploit the fact that each calendar is already sorted to get O(n log k), and
when is that worth the extra code?
