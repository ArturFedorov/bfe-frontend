# 108. Date Range Picker

**Difficulty:** Hard
**Estimated time:** 40–45 min
**Topics:** Calendar arithmetic without time zones, ARIA grid pattern, roving tabindex, focus management across re-renders, controlled range selection, hover preview

---

## Scenario

The media-operations console schedules release windows — "this title is live from the 15th to the
18th" — and until now the form had two native date inputs. Operators hated it: you could not see
both ends on one calendar, picking the end before the start produced an inverted window that the
server rejected, and keyboard users had no way to walk the month. Build the pure calendar helpers
and a controlled `DateRangePicker` that follows the ARIA grid pattern: one tab stop, arrow keys
that cross month boundaries, a hover preview and a live status line.

Dates are plain `YYYY-MM-DD` strings. There are no instants, offsets or DST here — a release
window is a calendar fact, not a moment in time.

## Requirements

1. **Pure helpers.**
   - `daysInMonth(year, month)` — `month` is 1–12; Gregorian leap rules (2000 and 2024 leap,
     2100 not).
   - `monthGrid(year, month, weekStartsOn)` returns exactly 6 rows × 7 columns of
     `'YYYY-MM-DD' | null`; column 0 is `weekStartsOn` (0 Sunday, 1 Monday); cells before the
     1st and after the last day are `null`.
   - `isBetween(day, start, end)` is true when `day` lies **strictly** between the two bounds in
     either order; false whenever a bound is `null`.
   - `addMonths('YYYY-MM', n)` crosses year boundaries both ways.
2. **Calendar rendering.** A header with buttons named `Previous month` / `Next month` and a
   `role="heading"` reading `Month YYYY` (English month names). A `role="grid"` whose
   accessible name is the same `Month YYYY`, a first `role="row"` of seven `role="columnheader"`
   cells showing `Mon`…`Sun` (full name as `aria-label`), then six `role="row"`s of
   `role="gridcell"`s. Day cells have the accessible name `D Month YYYY` (e.g. `15 March 2026`)
   and show the day number; padding cells are empty `gridcell`s. The first month shown is
   `initialMonth`, else the month of `value.start`, else the month of `today`.
3. **Selection from `value`.** Start and end cells carry `aria-selected="true"`; every other day
   cell `aria-selected="false"`. Days strictly between them carry the `data-in-range` attribute.
   The component is fully controlled: it keeps no copy of `value`.
4. **Click flow.** With no start (or with both bounds set), a click calls
   `onChange({ start: day, end: null })`. With a start and no end, a click sets the end — if the
   clicked day is before the start, the two are swapped (`{ start: day, end: oldStart }`).
   Clicking the start again makes a single-day range.
5. **Hover preview.** While a start is set and the end is not, hovering a day marks every day of
   the would-be range (both directions, hovered day included, start excluded) with
   `data-preview`. Leaving the grid clears it. Preview never calls `onChange` and never appears
   once both bounds are set.
6. **Bounds.** Days before `min` or after `max` (inclusive bounds) carry `aria-disabled="true"`;
   click, Enter and Space on them do nothing. They stay focusable so arrow navigation is not
   blocked.
7. **Keyboard (ARIA grid).** Exactly one day cell has `tabIndex=0`: the day the keyboard cursor
   last visited, else `value.start`, else `today`, else the 1st of the visible month (whichever
   is in the visible month). From a focused cell: `ArrowLeft`/`ArrowRight` move ±1 day,
   `ArrowUp`/`ArrowDown` ±7 days, `Home`/`End` go to the first/last day of the week
   (respecting `weekStartsOn`), `PageUp`/`PageDown` move ±1 month keeping the day-of-month
   clamped to the target month's length, `Enter`/`Space` select like a click. When the cursor
   leaves the visible month, the grid re-renders to the new month **and focus follows** to the
   new cell. Handled keys call `preventDefault()`.
8. **Status.** A `role="status"` paragraph reads `Select a start date`, then
   `Start: YYYY-MM-DD End: not set`, then `Start: YYYY-MM-DD End: YYYY-MM-DD`.

`today` is a prop (`YYYY-MM-DD`) so tests can pin it; it defaults to the local calendar date and
is also exposed as `aria-current="date"` on that cell.

## Acceptance criteria

- [ ] `daysInMonth` for Feb 2026/2024/2100/2000, Apr, Dec.
- [ ] `monthGrid(2026, 3, 1)` row 0 is six `null`s then `2026-03-01`; row 5 is `03-30`, `03-31`
      and five `null`s; `monthGrid(2026, 3, 0)` starts with `2026-03-01`.
- [ ] `isBetween` exclusive, order-insensitive, `null`-safe.
- [ ] `addMonths` over December and January, large positive and negative steps.
- [ ] Heading and grid named `March 2026`, Mon–Sun headers, 31 day cells; `weekStartsOn: 0`
      gives Sun–Sat.
- [ ] Previous / Next buttons move the heading and the cell count (Apr 30, Feb 28).
- [ ] Default month from `value.start`, else from `today`.
- [ ] `aria-selected` on both bounds, `data-in-range` strictly between.
- [ ] A parent that ignores `onChange` sees `onChange` called once and no selection rendered.
- [ ] Click flow: start → end → start over; same-day range; **senior:** end-before-start swap.
- [ ] Hover preview forwards and backwards, no `onChange`, cleared on leave, none when both set.
- [ ] `min`/`max` disable cells and swallow click/Enter.
- [ ] Exactly one tabbable cell: start when present, otherwise today; Tab reaches it after the
      two buttons.
- [ ] Arrow / Home / End / PageUp / PageDown / Enter / Space behave as specified.
- [ ] **Senior:** ArrowRight from 31 March re-renders to April with `1 April 2026` focused and
      the only tabbable cell; ArrowUp from 3 March lands on 24 February.
- [ ] Status text for empty, partial and complete ranges.

## Baseline a11y

- `role="grid"` named by the heading via `aria-labelledby`; `role="row"`, `role="columnheader"`,
  `role="gridcell"` nesting is intact (padding cells are still `gridcell`s so rows stay
  rectangular).
- One tab stop in the grid (roving `tabIndex`); arrow keys do all intra-grid movement.
- Day cells have a full-date accessible name, not just the number.
- `aria-selected`, `aria-disabled` and `aria-current="date"` are real ARIA states; the visual
  `data-*` attributes are only styling hooks.
- The status line is `role="status"` (polite live region), never `role="alert"`.

## Constraints

- No date libraries. `Date.UTC`/`getUTC*` (or pure arithmetic) is fine for day stepping because
  UTC has no DST; never use local-time `Date` methods for calendar math.
- No `document.querySelector` outside the focus-following effect.
- The component keeps no copy of `value`; its own state is only the visible month, the keyboard
  cursor and the hovered day.
- No `useEffect` that calls `onChange`.

## Interviewer follow-ups

- Operators in Tokyo and Los Angeles see the same `YYYY-MM-DD` release window — which is what
  they want. Where does the "live at 00:00 in the title's home market" conversion belong, and
  what must the API gain to carry it?
- A second calendar month side by side (two grids, one header pair). What changes in the
  keyboard model — is it one grid or two, and where does `ArrowRight` from the 31st go?
- Preset ranges ("Next 7 days", "This quarter") above the grid. Are they part of the picker's
  contract or a wrapper's, and how do they interact with `min`/`max`?
- The server rejects windows longer than 90 days. Show it live during the hover preview without
  turning the preview into an error state.

## Say out loud

- **State shape first:** `value` lives in the parent; my state is `month`, `focusedDay`,
  `hoverDay`. Everything rendered (selection, in-range, preview, tabbable cell) is derived.
- **Race / cleanup hazard:** focus after a cross-month arrow. The new cell does not exist until
  React commits, so I set a "focus pending" ref and resolve it in an effect — not
  `element.focus()` inside the key handler.
- **One data-shape question:** "Is `end` inclusive? A one-night window is `15 → 16` or
  `15 → 15`?"
- **One failure-handling question:** "If `value.start` is outside `min`/`max` (stale draft), do I
  render it selected-but-disabled or clear it?"
- **First test you'd write:** `monthGrid(2026, 3, 1)[0]` is six `null`s then `2026-03-01` — the
  leading-offset arithmetic before any UI.
