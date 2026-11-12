# 087. Quiet Hours Merge

**Difficulty:** Medium
**Topics:** Interval Merging, Binary Search, Modular Arithmetic, Time Windows

---

## Description

A marketing-automation platform must never push a notification during a
customer's **quiet hours**. Each customer has a list of weekly quiet windows
such as "every night 22:00–07:00" or "all of Sunday". The scheduler asks two
questions millions of times a day: *is this minute quiet?* and *if so, when is
the next allowed minute?*

Represent time as **minutes since Monday 00:00** in a 10080-minute week.
A `Window` is half-open `[start, end)` with `0 <= start < 10080`. A window
whose `end` exceeds `10080` **wraps**: it runs through Sunday midnight into
Monday (e.g. `{ start: 10020, end: 10140 }` is Sun 23:00 → Mon 01:00).

Implement:

1. `normalize(windows)` — split wrapping windows into two pieces, sort by
   `start`, and merge overlapping **and adjacent** windows (`[a, b)` + `[b, c)`
   → `[a, c)`). The result is sorted, disjoint, non-wrapping, and every window
   has `start < end <= 10080`. Empty windows (`end === start`) are dropped.
   `normalize` is idempotent.
2. `isQuiet(normalized, minuteOfWeek)` — `true` when the minute falls inside a
   window. Must use **binary search** over the normalized list, not a scan.
3. `nextAllowed(normalized, minuteOfWeek)` — the same minute if it is allowed,
   otherwise the `end` of the covering window, **modulo 10080** so that
   Sunday-night quiet hours resolve to Monday morning. If the quiet windows
   cover the entire week there is no allowed minute: throw a `RangeError`.
4. `fromDate(date)` — minute-of-week for a `Date`, using the **UTC** getters
   (`getUTCDay`, `getUTCHours`, `getUTCMinutes`); Monday is day 0.
5. `toMinutes(label)` — parses `'Tue 22:00'` into a minute-of-week
   (`Mon Tue Wed Thu Fri Sat Sun`, 24-hour clock). Throws `RangeError` on a
   malformed label. Mostly a helper for readable tests.

`isQuiet` and `nextAllowed` expect the **output of `normalize`**; behaviour on
raw, unsorted input is undefined.

## Examples

```ts
const nightly = [
  { start: toMinutes('Mon 22:00'), end: toMinutes('Tue 07:00') },
  { start: toMinutes('Tue 22:00'), end: toMinutes('Wed 07:00') },
  { start: toMinutes('Sun 22:00'), end: 10080 + 7 * 60 }, // wraps into Monday
];

const q = normalize(nightly);
// [
//   { start: 0,    end: 420 },    // Mon 00:00–07:00 (from the wrapping window)
//   { start: 1320, end: 1860 },   // Mon 22:00–Tue 07:00
//   { start: 2760, end: 3300 },   // Tue 22:00–Wed 07:00
//   { start: 9960, end: 10080 },  // Sun 22:00–Mon 00:00
// ]

isQuiet(q, toMinutes('Mon 23:30')); // true
isQuiet(q, toMinutes('Tue 07:00')); // false — end is exclusive

nextAllowed(q, toMinutes('Tue 12:00')); // 1800  (already allowed)
nextAllowed(q, toMinutes('Mon 23:30')); // 1860  (Tue 07:00)
nextAllowed(q, toMinutes('Sun 23:00')); // 420   (Mon 07:00 — wrapped)

normalize([{ start: 0, end: 60 }, { start: 60, end: 120 }]); // [{ start: 0, end: 120 }]

fromDate(new Date('2026-11-10T22:00:00Z')); // Tue 22:00 → 2760
```

## Constraints

- `0 <= windows.length <= 10_000`; `0 <= start < 10080`; `start <= end <= start + 10080`.
- Throw `RangeError` from `normalize` when a window violates those bounds.
- A window with `end - start === 10080` means the whole week; `normalize`
  returns `[{ start: 0, end: 10080 }]`.
- `minuteOfWeek` is an integer in `[0, 10080)`.
- `nextAllowed` always returns a value in `[0, 10080)` and throws `RangeError`
  only when the entire week is quiet.
- Do not mutate the input array or its window objects.

## Target

`normalize` is O(n log n) (sort dominated); `isQuiet` and `nextAllowed` are
O(log n) per query via binary search for the last window with `start <= m`.

Senior signal: splitting the wrap *before* sorting so that merging stays a
single linear pass; merging on `start <= currentEnd` (not `<`) to collapse
adjacent windows; and recognising that after one modulo wrap `nextAllowed`
may land inside the window that starts at minute 0, so it must jump again —
and that a second wrap is impossible unless the week is fully quiet.

## Interviewer follow-up

Customers live in different time zones and the platform stores quiet hours in
local time. Where does the conversion to a UTC minute-of-week belong, what
breaks on the two DST transition days, and how would you precompute the next
allowed minute for a batch of 1M sends sorted by send time in O(n + k) instead
of O(n log k)?
