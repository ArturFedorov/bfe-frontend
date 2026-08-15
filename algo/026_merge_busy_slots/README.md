# 026. Merge Busy Slots

**Difficulty:** Easy
**Topics:** Intervals, Sorting, Merging

---

## Description

An availability service receives a user's busy slots collected from several
sources — meetings, focus blocks, out-of-office — as intervals of minutes
`{ start, end }` with half-open `[start, end)` semantics. The list is unsorted
and slots may overlap or nest arbitrarily. Produce the minimal clean view: a
sorted list of disjoint busy blocks covering exactly the same minutes.
**Touching intervals merge too** — `[1, 3)` and `[3, 5)` become a single block
`[1, 5)`, because there is no usable free time between them. The output must be
sorted by `start` and contain no two blocks that overlap or touch.

## Examples

```ts
mergeBusySlots([
  { start: 10, end: 30 },
  { start: 20, end: 40 },
]); // [ { start: 10, end: 40 } ]

mergeBusySlots([
  { start: 1, end: 3 },
  { start: 3, end: 5 },
]); // [ { start: 1, end: 5 } ] — touching intervals MERGE

mergeBusySlots([
  { start: 50, end: 60 },
  { start: 0, end: 10 },
]); // [ { start: 0, end: 10 }, { start: 50, end: 60 } ]
```

## Constraints

- `0 <= slots.length <= 100_000`
- `0 <= start < end <= 10^9`
- Input is **unsorted**; slots may overlap, nest, or duplicate
- Touching intervals (`end === next.start`) merge into one block
- Return a new array of new objects; do not mutate the input

## Target

O(n log n) time, O(n) space.

## Interviewer follow-up

If slots arrived one at a time and you had to keep the merged view current
after every insert, which data structure would you reach for and why?
