# 096. Send Schedule Picker

**Difficulty:** Medium
**Estimated time:** 50–60 min
**Topics:** Intl.DateTimeFormat, time zones and DST, wall-clock vs instant, quiet hours, controlled forms, derived lists

---

## Scenario

Campaign managers in the engagement tool schedule sends for audiences around the world: "every
Monday at 09:00 London time", "daily at 18:00 Tokyo, but never between 22:00 and 07:00". The
first picker stored a UTC instant and added 24 hours per day, so a 09:00 campaign started
arriving at 10:00 the week the clocks changed; quiet hours were checked in the browser's zone,
not the audience's; and nobody could see when the next five sends would actually go out.
Build the pure zone helpers and a controlled `SchedulePicker` that previews the next sends in the
selected zone.

## Requirements

1. `localParts(dateUtc, timeZone)` returns `{ year, month, day, hour, minute, weekday }` for
   the instant as seen in `timeZone`, computed with `Intl.DateTimeFormat` using
   `hourCycle: 'h23'` (midnight is hour `0`, never `24`). `month` is 1–12; `weekday` is 0
   (Sunday) – 6 (Saturday).
2. `fromLocalParts({ year, month, day, hour, minute }, timeZone)` is the inverse: the UTC
   instant at which that wall clock shows in `timeZone`, seconds and milliseconds zero. Day
   overflow is normalised (`day: 32` in May → June 1). Behaviour inside a DST gap or overlap
   hour is not tested.
3. `formatLocal(dateUtc, timeZone)` returns `YYYY-MM-DD HH:MM` in the zone (zero-padded).
4. `isInQuietHours(dateUtc, timeZone, quiet)`: `quiet` is `null` → `false`. Otherwise compare
   the local minutes-since-midnight `m` with `start`/`end` parsed from `HH:MM`:
   `start < end` → `start ≤ m < end`; `start > end` (window crosses midnight) →
   `m ≥ start || m < end`; `start === end` → `false` (empty window).
5. `shiftOutOfQuietHours(dateUtc, timeZone, quiet)` returns `dateUtc` itself when not in
   quiet hours; otherwise the first allowed instant: local `end` on the same local day when
   `m < end`, else local `end` on the next day.
6. `nextSends(schedule, nowUtc, count)`:
   - `once`: `[shift(startAt)]` when `startAt ≥ now`, otherwise `[]`.
   - `daily` / `weekly`: occurrences are `startAt`'s **local** wall clock stepped by 1 / 7
     local days (`fromLocalParts` with `day + k·step`), so the local hour is stable across a
     DST change. The first occurrence is the first one `≥ now`; return the next `count`, each
     passed through `shiftOutOfQuietHours`. The `now` comparison uses the unshifted
     occurrence.
7. `<SchedulePicker value onChange now />` is **fully controlled** and renders:
   - `<input type="date">` labelled `Date` and `<input type="time">` labelled `Time`, showing
     `startAt` in `value.timeZone`. Changing either calls `onChange` with the new `startAt`
     (`fromLocalParts(...).toISOString()`), everything else unchanged.
   - `<select>` labelled `Time zone` with exactly the options in `TIME_ZONES`. Changing the
     zone **keeps the wall clock**: 09:00 UTC → Asia/Tokyo becomes 09:00 Tokyo
     (`startAt` changes to `2026-05-04T00:00:00.000Z`), so the marketer's chosen time is kept.
   - A `radiogroup` labelled `Recurrence` with radios `Once` / `Daily` / `Weekly`.
   - A checkbox labelled `Respect quiet hours`. Checked ⇔ `quietHours !== null`. Checking it
     sets `{ start: '22:00', end: '08:00' }`; unchecking sets `null`. While checked, two
     `<input type="time">` labelled `Quiet from` / `Quiet until` edit `start` / `end`; they
     are not rendered while unchecked.
   - A `role="list"` named `Next sends` with one `listitem` per entry of
     `nextSends(value, now, 5)`, formatted with `formatLocal` in `value.timeZone`. When the
     list is empty a paragraph `No upcoming sends` is shown.
   - A `role="alert"` reading `Start time is in the past` when `startAt < now`; otherwise no
     alert is rendered. The list then naturally starts from the next occurrence.

## Acceptance criteria

- [ ] `localParts` returns correct parts for Asia/Tokyo and reports local midnight as hour 0.
- [ ] `fromLocalParts` round-trips with `localParts`, resolves 09:00 London on 2026-03-29
      (BST) to `08:00Z`, and normalises day overflow.
- [ ] `formatLocal` pads and uses the zone.
- [ ] `isInQuietHours`: inclusive start, exclusive end, crosses-midnight window, `null`,
      `start === end`.
- [ ] `shiftOutOfQuietHours`: unchanged when allowed; same-day end; next-day end when inside a
      crossing window after `start`.
- [ ] `nextSends`: `once` future/past; daily from the next occurrence when `startAt` is in
      the past; each shifted out of quiet hours.
- [ ] Senior: daily 09:00 Europe/London across 2026-03-29 yields `…27T09:00Z`, `…28T09:00Z`,
      `…29T08:00Z`, `…30T08:00Z` (local hour stays 9). Weekly 09:00 America/New_York across
      2026-11-01 yields `10-26T13:00Z` then `11-02T14:00Z`.
- [ ] Component shows date/time/zone/recurrence/quiet state from `value`; `Next sends` has 5
      items in the zone.
- [ ] Changing time, date, zone (wall clock kept), recurrence and quiet hours each call
      `onChange` with exactly the expected `Schedule`.
- [ ] A parent that ignores `onChange` leaves the inputs unchanged (controlled).
- [ ] Past start → alert + list starts at the next occurrence; `once` in the past → alert +
      `No upcoming sends`; future start → no alert.
- [ ] Senior: the rendered London list shows `09:00` on every row across the DST change.
- [ ] Quiet hours shift the rendered rows (09:00 daily with quiet 08:00–10:00 → rows at 10:00).

## Baseline a11y

- Every input and select has a visible `<label>`; radios live in a `role="radiogroup"` with an
  accessible name.
- The list has `role="list"` and `aria-label="Next sends"`; rows are `listitem`s.
- The past-start warning is `role="alert"`.
- Native date/time inputs are used so keyboard entry works without custom widgets.

## Constraints

- No third-party libraries (no date-fns/luxon/dayjs). `Intl.DateTimeFormat` with
  `formatToParts` is the only zone source; never use `getTimezoneOffset`.
- No arithmetic of `+ 24 * 3600 * 1000` for the recurrence step.
- The component keeps no copy of `value` in state.

## Interviewer follow-ups

- A customer-level "local send time" (each recipient at their own 09:00) means one campaign
  fans out into many instants. What changes in `Schedule` and in the preview?
- The server's job scheduler stores UTC instants. How do you keep a recurring schedule
  correct across DST when the server only sees `startAt`? What must it store in addition?
- Quiet hours may differ per channel (SMS stricter than email, by law in some countries). Where
  does that policy live, and how does the picker show "shifted because of SMS rules"?
- The marketer picks 02:30 on a spring-forward night, a time that does not exist. What should
  the UI do, and what does your `fromLocalParts` currently return?

## Say out loud

- **State shape first:** `Schedule` is the only state and it lives in the parent; `startAt`
  is an instant, the zone is a presentation and stepping concern; everything shown is derived.
- **Race / cleanup hazard:** none async here — the hazard is wall-clock vs instant drift:
  stepping in UTC changes the local hour across DST; stepping in local parts does not.
- **One data-shape question:** "Is `startAt` the first send or the template's anchor — if a
  marketer edits a running schedule, do past sends move?"
- **One failure-handling question:** "If the zone string is not supported by the runtime's
  ICU, should the picker fall back to UTC and warn, or refuse to render the preview?"
- **First test you'd write:** `fromLocalParts({2026-03-29 09:00}, 'Europe/London')` is
  `08:00Z` — the DST-aware inverse before any UI.
