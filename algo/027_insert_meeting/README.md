# 027. Insert Meeting

**Difficulty:** Medium
**Topics:** Intervals, Merging, One-pass Algorithms

---

## Description

A calendar keeps a user's busy time as an **already-merged** view: a list of
disjoint, non-touching blocks sorted by `start`, with half-open `[start, end)`
semantics (the invariant produced by task 026). A new meeting comes in. Insert
it and return a calendar that satisfies the same invariant — in **one pass**
over the existing blocks, without re-sorting. The new meeting may overlap zero,
one, or many existing blocks, and consistent with 026, a meeting that merely
**touches** an existing block (`end === block.start` or `start === block.end`)
merges with it.

## Examples

```ts
insertMeeting(
  [{ start: 0, end: 10 }, { start: 30, end: 40 }],
  { start: 15, end: 20 }
);
// [ { start: 0, end: 10 }, { start: 15, end: 20 }, { start: 30, end: 40 } ]

insertMeeting(
  [{ start: 0, end: 10 }, { start: 30, end: 40 }],
  { start: 5, end: 35 }
);
// [ { start: 0, end: 40 } ] — swallows the gap and both blocks

insertMeeting(
  [{ start: 0, end: 10 }, { start: 20, end: 30 }],
  { start: 10, end: 20 }
);
// [ { start: 0, end: 30 } ] — touching on both sides bridges the blocks
```

## Constraints

- `0 <= calendar.length <= 100_000`
- `calendar` is sorted by `start`, disjoint, and non-touching (gap > 0 between blocks)
- `0 <= start < end <= 10^9` for the calendar and the new meeting
- Touching intervals merge (same rule as 026)
- Single pass, no sorting — the input order is the structure to exploit
- Return a new array; do not mutate `calendar` or `meeting`

## Target

O(n) time, O(n) space for the result.

## Interviewer follow-up

The calendar is huge and the meeting usually overlaps only a handful of blocks.
How would you get to O(log n + k) using binary search, and what are the two
boundary searches you need?
