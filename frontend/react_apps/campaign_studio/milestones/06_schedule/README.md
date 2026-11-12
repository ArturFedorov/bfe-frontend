# Milestone 06. Scheduling: Quiet Hours and Recurrence

**Difficulty:** Hard
**Estimated time:** 2 evenings (one for `schedule.ts`, one for the picker)
**Topics:** Intl / timezones, DST, interval merging, binary search, controlled forms

---

## Scenario

Marketing ops schedule sends in the customer's timezone, and legal insists on
quiet hours: nothing goes out between 21:00 and 08:00 local, ever. The current
tool stores a UTC instant and a cron string, which is why last November's
"09:30 every Monday" campaign went out at 08:30 after the clocks changed, and
why a "Saturday 23:00–01:00" quiet window never blocked anything on Sunday
morning. Rebuild the scheduling core with no date library: `Intl.DateTimeFormat`
is the only timezone source you have, and the picker must preview the next
sends so an operator can see the DST shift before it happens.

Two files, in this order:

1. `schedule.ts` — pure functions over minutes-of-week and zoned wall clocks.
2. `SchedulePicker.tsx` — a controlled form over a `Schedule` value with a live
   "Next sends" preview.

## Requirements

### `schedule.ts`

1. `parseHHmm('09:30')` → `570` (minutes since midnight). Reject anything that
   is not `H:mm`/`HH:mm` within `00:00`–`23:59` by throwing.
2. `zonedParts(date, timeZone)` returns the wall clock `{ year, month (1-12), day,
   hour (0-23), minute, weekday (0 = Sunday) }` in that zone, computed with
   `Intl.DateTimeFormat(...).formatToParts`. Use `hourCycle: 'h23'` — some ICU
   builds return `"24"` for midnight with `hour12: false`.
3. `zonedTimeToUtc(parts, timeZone)` is the inverse: the instant at which the
   wall clock in `timeZone` reads `parts`. It must round-trip with `zonedParts`
   for ordinary times and resolve the two DST edge cases deterministically:
   - **gap** (the local time never happens, e.g. 02:30 on 2026-03-08 in
     `America/New_York`): return the instant one hour later (03:30 EDT, i.e.
     `07:30Z`) — equivalently, apply the offset that was in force *before* the
     transition;
   - **overlap** (the local time happens twice, e.g. 01:30 on 2026-11-01):
     return the *earlier* instant (`05:30Z`, still EDT).
   Hint: compute the offsets a day before and a day after the naive
   `Date.UTC(parts)`, try both candidates, keep the ones whose `zonedParts`
   round-trip; if none do you are in a gap.
4. `minuteOfWeek(date, timeZone)` = `weekday * 1440 + hour * 60 + minute` of the
   zoned wall clock, in `[0, 10080)`.
5. `normalizeQuietHours(windows)` turns `QuietHours[]` into sorted, merged,
   non-overlapping `MinuteRange[]` (half-open `[start, end)`):
   - `days: []` means every day;
   - `end > start` is a same-day window; `end <= start` wraps past midnight and
     is split into `[start, 24:00)` on that day plus `[00:00, end)` on the next
     day; `end === start` therefore covers the whole 24 h from `start`;
   - a Saturday window that wraps lands its tail on **Sunday**, the start of the
     week (`[0, end)`);
   - overlapping *and adjacent* ranges merge (`09:00–10:00` + `10:00–11:00` is
     one range), zero-length pieces are dropped.
6. `isQuiet(ranges, minute)` is a binary search over the normalised ranges;
   `minute` is taken modulo the week (negative values included).
7. `nextAllowed(ranges, minute)` returns the first minute ≥ `minute` (mod week)
   that is not quiet — `minute` itself when it is allowed. It must wrap past the
   week end (Saturday 23:00 inside a `Sat 22:00 → Sun 04:00` block → `240`), and
   throw when the ranges cover the whole week (there is no answer).
8. `nextSends(schedule, now, count)` returns the next `count` send instants
   strictly after `now`, ascending:
   - candidates are `schedule.time` on each active local day from
     `schedule.startDate` onwards: every day for `daily`, the days listed in
     `weekdays` for `weekly` (empty `weekdays` → `[]`), only `startDate` for
     `once`;
   - a candidate is converted with `zonedTimeToUtc`, so the *wall clock* stays
     constant across a DST change while the UTC instant shifts;
   - a candidate inside quiet hours is pushed to `nextAllowed` of its minute of
     week — do that push on the wall clock (add the minute delta to the local
     parts, then convert) so a push across a DST boundary still lands on the
     right local minute;
   - candidates that collapse onto the same instant are de-duplicated;
   - `count <= 0` → `[]`; `once` → at most one; nothing is ever returned at or
     before `now`.
   Iterate day by day with civil (UTC-based) date arithmetic and put a hard cap
   on the loop — never `while (true)` over a schedule that might produce nothing.

### `SchedulePicker.tsx`

9. Fully controlled: render from `value`, never keep a copy in state. Every edit
   calls `onChange` with a *new* `Schedule` object (`{ ...value, …patch }`).
10. Fields and accessible names (tests query by these):
    - `Timezone` — `<select>` over the exported `TIMEZONES`;
    - `Start date` — `<input type="date">` bound to `startDate`;
    - `Send time` — `<input type="time">` bound to `time`;
    - `Recurrence` — a `<select>` with `once` / `daily` / `weekly` (a select, not
      radios, so one accessible name covers the control);
    - a `Weekdays` fieldset of checkboxes named `Sunday` … `Saturday`, rendered
      **only** when `recurrence === 'weekly'`; toggling one reports `weekdays`
      sorted ascending;
    - one row per `quietHours` entry with `Quiet start` / `Quiet end` time inputs
      and a `Remove` button; an `Add quiet hours` button appends
      `{ days: [], start: '22:00', end: '07:00' }`. Per-day quiet windows keep
      their `days` but the picker only edits times (the app seeds `days: []`).
11. Preview: an `<ol aria-label="Next sends">` with `previewCount` (default 5)
    items, each `nextSends(value, now(), previewCount)` instant formatted in
    `value.timezone` with `Intl.DateTimeFormat('en-US', { weekday: 'short',
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:
    '2-digit', hourCycle: 'h23' })` → `Mon, Nov 2, 2026, 09:30`. It recomputes
    whenever `value` changes. `now` is injected (default `() => new Date()`) so
    tests are deterministic.
12. When `nextSends` throws (quiet hours cover the whole week) render the message
    in a `role="alert"` instead of the list; the list comes back as soon as the
    value is fixable again.

## Acceptance Criteria

- [ ] `parseHHmm` accepts `00:00`–`23:59` and throws on `24:00` / `9h30`.
- [ ] `zonedParts` is right for UTC, Kolkata (+05:30, calendar day rolls over),
      and New York on both sides of the March and November transitions.
- [ ] `zonedTimeToUtc` round-trips, and returns `07:30Z` for the spring gap
      and `05:30Z` for the autumn overlap.
- [ ] `normalizeQuietHours` sorts, merges overlaps and adjacent ranges, expands
      `days: []`, splits midnight wraps, and puts Saturday's tail on Sunday.
- [ ] `isQuiet` is half-open and modulo the week; `nextAllowed` returns the
      input when allowed, skips, wraps, and throws on full coverage.
- [ ] `nextSends`: daily UTC excludes a send exactly at `now`; weekly Mon/Wed/Fri
      09:30 in New York yields `13:30Z, 13:30Z, 14:30Z, 14:30Z` around
      2026-11-01 with the local clock fixed at 09:30; `once` yields ≤ 1 and
      nothing when past; quiet-hour pushes and de-duplication work.
- [ ] Picker renders controlled fields, weekday boxes only for `weekly`, quiet
      rows add/remove, every edit reaches `onChange` as a new object, and the
      `Next sends` list (or the alert) follows the value.

## Baseline a11y

- Every input has a visible `<label>`; the weekday checkboxes live in a
  `<fieldset>` with a `<legend>`.
- The preview is a real list with `aria-label="Next sends"`; the full-week
  error is a `role="alert"`.
- Buttons are `<button type="button">` so they never submit a surrounding form.

## Constraints

- React + TypeScript only. No date libraries — `Intl.DateTimeFormat` and
  `Date.UTC` are all you get.
- Do not change the exported types or signatures; App renders
  `<SchedulePicker value={DEFAULT_SCHEDULE} onChange={setSchedule} />`.
- Keep `schedule.ts` free of React and DOM.

## How it plugs into the app

The **Schedule** tab (`app/App.tsx` → `ScheduleArea`) owns a `Schedule` in
`useState` seeded with `DEFAULT_SCHEDULE` (Mon/Wed/Fri 09:30 New York, quiet
21:00–08:00) and renders the picker inside a `TaskBoundary`. This milestone
calls no `shell/api` method — it is pure computation over the value. Later, a
campaign's schedule would be saved via `updateCampaign(id, patch)` and the
"Next sends" preview reused on the campaign detail page.

## Interviewer follow-ups (talk-through, not implemented)

- The customer, not the campaign, has the timezone. How does `nextSends` change
  when every recipient gets their own 09:30, and where do quiet hours apply?
- Quiet hours are a legal requirement per *country*. Where would you resolve
  country → windows, and how do you keep the normalised ranges cached?
- `normalizeQuietHours` runs on every keystroke in the picker. When does that
  matter, and what would you memoise?
- A schedule saved in 2025 says `Europe/Kyiv` and the zone rules change next
  year. What do you store so the next sends are still right?

## Say out loud

- "Two clocks: instants (UTC ms) for storage and comparison, wall clocks for
  everything the operator sees. The only bridge is `zonedParts` / `zonedTimeToUtc`."
- Name the DST hazard before writing code: a local time can not exist or exist
  twice; say which instant you return and why.
- "Minutes of week is a 10080-wide ring; a wrapping window is just two
  intervals, and `Saturday → Sunday` is the ring closing."
- Ask one data-shape question: "Is `startDate` in the schedule's timezone or
  the operator's?"
- Name the first test you'd write: "09:30 weekly in New York stays 09:30 local
  across 2026-11-01 while the UTC instant moves by an hour."
