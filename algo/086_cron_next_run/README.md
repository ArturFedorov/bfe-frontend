# 086. Cron Next Run

**Difficulty:** Medium
**Topics:** Parsing, Date Arithmetic, Search Space Pruning, Calendar Edge Cases

---

## Description

Send schedules in a marketing-automation platform are stored as simplified
5-field cron expressions — `minute hour day-of-month month day-of-week` —
and the scheduler UI shows "next 5 sends". Everything is **UTC**.

Field syntax: `*`, a single value `5`, a list `1,15`, a range `1-5`, and
steps `*/15` or `1-30/5` (range start, then every `step`). Lists may mix
any of these: `1-5,10,*/20`. Ranges: minute `0-59`, hour `0-23`,
day-of-month `1-31`, month `1-12`, day-of-week `0-6` with `0 = Sunday`.
No names (`MON`, `JAN`), no `7` for Sunday, no `5/3` without a range.

Three exports:

1. `parseCron(expr)` → `CronSpec` with each field expanded to a **sorted,
   unique** number array plus `domRestricted` / `dowRestricted` flags that
   are `true` when the field is anything other than exactly `*`. Throw a
   `SyntaxError` for a wrong field count, non-numeric tokens, out-of-range
   values, reversed ranges (`5-1`), or a step `< 1`.
2. `matches(spec, date)` — does this **minute** match? Seconds and
   milliseconds are ignored. The day check follows Vixie cron: when **both**
   day-of-month and day-of-week are restricted, the day matches if **either**
   does; when only one is restricted, only that one is consulted; when
   neither is, every day matches. (That is why the flags exist: a `*`
   day-of-week expands to all seven days, so a naive "either" test would
   make `0 9 15 * *` fire every day.)
3. `nextRuns(expr, from, count)` — the first `count` matching minutes
   **strictly after** `from`, as `Date`s. `count <= 0` → `[]`. Don't walk
   minute by minute through everything: when the month can't match, jump to
   the 1st of the next month; when the day can't, jump to the next day
   `00:00`; when the hour can't, jump to the next candidate hour; when the
   minute can't, jump to the next candidate minute. 100 runs of
   `0 9 * * 1-5` must compute in under 50ms. If no run exists within **8
   years** of the previous one (e.g. `0 0 30 2 *` — February 30th), throw a
   `RangeError`; 8 years is enough to always see a leap day.

## Examples

```ts
parseCron('*/15 9-17 1,15 * 1-5');
// {
//   minute: [0, 15, 30, 45],
//   hour: [9, 10, 11, 12, 13, 14, 15, 16, 17],
//   dayOfMonth: [1, 15],
//   month: [1, 2, ..., 12],
//   dayOfWeek: [1, 2, 3, 4, 5],
//   domRestricted: true,
//   dowRestricted: true,
// }

const from = new Date('2025-01-01T09:07:00Z'); // a Wednesday

nextRuns('*/15 * * * *', from, 3);
// ['2025-01-01T09:15:00Z', '2025-01-01T09:30:00Z', '2025-01-01T09:45:00Z']

nextRuns('0 9 * * 1-5', new Date('2025-01-03T10:00:00Z'), 2); // Fri 10:00 →
// ['2025-01-06T09:00:00Z', '2025-01-07T09:00:00Z']           // Mon, Tue

nextRuns('0 9 1 * 1', from, 3);          // 1st of month OR Monday
// ['2025-01-06T09:00:00Z', '2025-01-13T09:00:00Z', '2025-01-20T09:00:00Z']
// (Jan 1 09:00 is skipped: `from` is already 09:07 that day)

nextRuns('0 0 30 * *', new Date('2025-02-01T00:00:00Z'), 1);
// ['2025-03-30T00:00:00Z']  — February has no 30th

nextRuns('0 0 30 2 *', from, 1); // throws RangeError
parseCron('0 9 * *');            // throws SyntaxError (4 fields)
parseCron('60 * * * *');         // throws SyntaxError (minute out of range)
```

## Constraints

- `expr` has exactly five whitespace-separated fields; extra/leading
  whitespace is fine.
- All field arrays in `CronSpec` are sorted ascending with no duplicates.
- All date math is UTC (`getUTC*` / `Date.UTC`). Never use local-time
  getters; the suite runs under whatever `TZ` the machine has.
- `nextRuns` results are strictly after `from` (a `from` that lands exactly
  on a matching minute is **not** included) and returned in ascending order.
- `nextRuns` must not mutate `from`.
- Performance: 100 runs of `0 9 * * 1-5` in `< 50ms`; 1000 runs of
  `*/5 * * * *` in `< 100ms`.

## Target

Parsing is O(length of expression). `nextRuns` is O(count × (candidate
hours + candidate minutes + skipped days)) — never O(minutes elapsed). The
shape to reach for:

```
t = truncateToMinute(from) + 1 minute
loop:
  if month(t) not in spec.month:   t = first of next month 00:00; continue
  if !dayMatches(t):               t = next day 00:00;            continue
  h = smallest hour in spec.hour >= hour(t)
  if none:                         t = next day 00:00;            continue
  if h > hour(t):                  t = t at h:00;                 continue
  m = smallest minute in spec.minute >= minute(t)
  if none:                         t = next hour :00;             continue
  t = t at h:m; emit t; t += 1 minute
```

`Date.UTC(y, m, d + 1)` normalises overflow, so "next day" and "first of
next month" need no calendar tables.

Senior signal: the `domRestricted`/`dowRestricted` flags (and why `*` must
not count as restricted), resetting lower fields to zero whenever a higher
field jumps, and the termination guard for impossible dates.

## Interviewer follow-up

The product now needs schedules in the customer's own time zone, e.g.
`0 9 * * 1-5` in `America/New_York`. What breaks on DST transition days
(the 02:30 that doesn't exist in March, the one that happens twice in
November)? How would you restructure `nextRuns` around `Intl.DateTimeFormat`
or a tz library so the field-matching logic stays zone-agnostic?
