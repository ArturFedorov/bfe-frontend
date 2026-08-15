# 063. Build Speed Watch

**Difficulty:** Medium
**Topics:** Monotonic Stack, Arrays, CI Analytics

---

## Description

Your CI dashboard tracks the total build time of the nightly build, one number
per day. The team wants a "when did it get better?" column: for each day, how
many days did they have to wait until a **strictly faster** (strictly smaller)
build time appeared? If no later day ever beat that build, the answer for that
day is `0`. Equal times do not count — a `10`-minute build is not "faster" than
another `10`-minute build. Return the answers as an array aligned with the
input.

## Examples

```ts
daysUntilFasterBuild([12, 15, 10, 10, 8]); // [2, 1, 2, 1, 0]
daysUntilFasterBuild([5, 6, 7, 8]);        // [0, 0, 0, 0] — it only got slower
daysUntilFasterBuild([9]);                 // [0]
```

## Constraints

- `0 <= buildTimes.length <= 100_000`; an empty input returns `[]`.
- Build times are positive finite numbers; duplicates are common.
- "Faster" means strictly smaller — equal values never resolve a wait.
- The result has the same length as the input; the input must not be mutated.

## Target

O(n) with a monotonic stack of unresolved indices; the O(n²) scan-ahead will fail the large-input test.

## Interviewer follow-up

Your stack holds indices, not values — what invariant does the stack maintain at all times, and why does that make the total work O(n)?
