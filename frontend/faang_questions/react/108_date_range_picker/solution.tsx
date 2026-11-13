/**
 * Reference solution for 108 — keep date_range_picker.tsx blank for redo practice;
 * this file is for comparison after your own attempt.
 *
 * State shape (say it out loud first): `value` lives in the parent. The picker
 * owns only `month` (visible `YYYY-MM`), `cursor` (the day the keyboard last
 * visited) and `hover` (preview). Selection, in-range, preview and the single
 * tabbable cell are all derived on render.
 *
 * Calendar maths uses `Date.UTC` / `getUTC*` only: UTC has no DST, so stepping
 * by 86 400 000 ms is always exactly one calendar day.
 */
import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent } from 'react';

/** `YYYY-MM-DD` calendar dates. No instants, no zones. */
export type DateRange = { start: string | null; end: string | null };

/** 0 = Sunday, 1 = Monday. */
export type WeekStart = 0 | 1;

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (next: DateRange) => void;
  /** Inclusive lower bound (`YYYY-MM-DD`). Days before it are `aria-disabled`. */
  min?: string;
  /** Inclusive upper bound (`YYYY-MM-DD`). Days after it are `aria-disabled`. */
  max?: string;
  /** Default 1 (Monday). */
  weekStartsOn?: WeekStart;
  /** `YYYY-MM` shown first. Defaults to the month of `value.start`, else of `today`. */
  initialMonth?: string;
  /** `YYYY-MM-DD` — injected so tests can pin it. Defaults to the local calendar date. */
  today?: string;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Index 0 = Sunday, matching `Date#getUTCDay`. */
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** `YYYY-MM-DD` → `[year, month(1–12), day]`. */
function parseDay(ymd: string): [number, number, number] {
  const [y, m, d] = ymd.split('-').map(Number);
  return [y, m, d];
}

/** UTC midnight for a calendar date — only ever used as an arithmetic carrier. */
function toUtc(ymd: string): Date {
  const [y, m, d] = parseDay(ymd);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/** Step a calendar date by `n` days (negative allowed). */
function addDays(ymd: string, n: number): string {
  const date = toUtc(ymd);
  date.setUTCDate(date.getUTCDate() + n);
  return fromUtc(date);
}

/** 0 (Sunday) … 6 (Saturday). */
function weekday(ymd: string): number {
  return toUtc(ymd).getUTCDay();
}

/** Number of days in `month` (1–12) of `year`, Gregorian leap rules. */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one; Date.UTC applies the leap rules.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * 6 rows × 7 columns of `YYYY-MM-DD` with `null` for the leading/trailing cells
 * that belong to other months. Column 0 is `weekStartsOn`.
 */
export function monthGrid(year: number, month: number, weekStartsOn: WeekStart): (string | null)[][] {
  const total = daysInMonth(year, month);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  // How many padding cells precede the 1st so that column 0 is `weekStartsOn`.
  const offset = (firstWeekday - weekStartsOn + 7) % 7;

  const rows: (string | null)[][] = [];
  for (let r = 0; r < 6; r++) {
    const row: (string | null)[] = [];
    for (let c = 0; c < 7; c++) {
      const day = r * 7 + c - offset + 1;
      row.push(day >= 1 && day <= total ? `${year}-${pad2(month)}-${pad2(day)}` : null);
    }
    rows.push(row);
  }
  return rows;
}

/** True when `day` lies strictly between `start` and `end` (either order). False when either bound is null. */
export function isBetween(day: string, start: string | null, end: string | null): boolean {
  if (start === null || end === null) return false;
  // ISO dates compare correctly as strings, so no parsing is needed here.
  const lo = start < end ? start : end;
  const hi = start < end ? end : start;
  return day > lo && day < hi;
}

/** `'2026-12' + 1 → '2027-01'`; `n` may be negative. */
export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  const index = y * 12 + (m - 1) + n; // months since year 0, so negatives floor correctly
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  return `${year}-${pad2(month)}`;
}

/** Same day-of-month `n` months away, clamped to the target month's length (31 Jan → 28 Feb). */
function addMonthsToDay(ymd: string, n: number): string {
  const [, , d] = parseDay(ymd);
  const ym = addMonths(ymd.slice(0, 7), n);
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${pad2(Math.min(d, daysInMonth(y, m)))}`;
}

/** The calendar date where the user physically is — the one place local-time getters are correct. */
function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** `2026-03-15` → `15 March 2026`. */
function longDate(ymd: string): string {
  const [y, m, d] = parseDay(ymd);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DateRangePicker({
  value,
  onChange,
  min,
  max,
  weekStartsOn = 1,
  initialMonth,
  today: todayProp,
}: DateRangePickerProps): JSX.Element {
  const today = todayProp ?? localToday();
  const [month, setMonth] = useState<string>(() => initialMonth ?? value.start?.slice(0, 7) ?? today.slice(0, 7));
  const [cursor, setCursor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  // Day to focus after the next commit. Set in the key handler, consumed in an
  // effect, because a cross-month move renders the target cell only on commit.
  const pendingFocus = useRef<string | null>(null);
  const headingId = useId();

  const [year, monthNumber] = month.split('-').map(Number);
  const grid = useMemo(() => monthGrid(year, monthNumber, weekStartsOn), [year, monthNumber, weekStartsOn]);
  const title = `${MONTH_NAMES[monthNumber - 1]} ${year}`;

  // Roving tabindex: the first candidate that lies in the visible month.
  const firstOfMonth = `${month}-01`;
  const tabStop =
    [cursor, value.start, today].find((d): d is string => d !== null && d.startsWith(month)) ?? firstOfMonth;

  // Columns in display order: weekStartsOn, weekStartsOn + 1, … (mod 7).
  const weekdayOrder = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);

  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${target}"]`)?.focus();
  });

  const isDisabled = (day: string): boolean => (min !== undefined && day < min) || (max !== undefined && day > max);

  /** Click / Enter / Space: start → end (swapping if needed) → start over. */
  const select = (day: string): void => {
    if (isDisabled(day)) return;
    const { start, end } = value;
    if (start === null || end !== null) {
      onChange({ start: day, end: null });
    } else if (day < start) {
      onChange({ start: day, end: start });
    } else {
      onChange({ start, end: day });
    }
  };

  /** Move the keyboard cursor; switches month when needed and queues focus. */
  const moveCursor = (day: string): void => {
    setCursor(day);
    pendingFocus.current = day;
    const ym = day.slice(0, 7);
    if (ym !== month) setMonth(ym);
  };

  const onCellKeyDown = (event: KeyboardEvent<HTMLDivElement>, day: string): void => {
    let next: string;
    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(day, -1);
        break;
      case 'ArrowRight':
        next = addDays(day, 1);
        break;
      case 'ArrowUp':
        next = addDays(day, -7);
        break;
      case 'ArrowDown':
        next = addDays(day, 7);
        break;
      case 'Home':
        next = addDays(day, -((weekday(day) - weekStartsOn + 7) % 7));
        break;
      case 'End':
        next = addDays(day, 6 - ((weekday(day) - weekStartsOn + 7) % 7));
        break;
      case 'PageUp':
        next = addMonthsToDay(day, -1);
        break;
      case 'PageDown':
        next = addMonthsToDay(day, 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        select(day);
        return;
      default:
        return; // not ours — let it bubble (Tab, Escape, …)
    }
    event.preventDefault();
    moveCursor(next);
  };

  // Hover preview only while picking the end; the hovered day itself is included.
  const previewing = value.start !== null && value.end === null && hover !== null && hover !== value.start;
  const isPreview = (day: string): boolean =>
    previewing && (day === hover || isBetween(day, value.start, hover));

  const statusText =
    value.start === null
      ? 'Select a start date'
      : `Start: ${value.start} End: ${value.end ?? 'not set'}`;

  return (
    <div className="date-range-picker">
      <div className="drp-header">
        <button type="button" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
          ‹
        </button>
        <h2 id={headingId} className="drp-title">
          {title}
        </h2>
        <button type="button" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
          ›
        </button>
      </div>

      <div
        role="grid"
        aria-labelledby={headingId}
        className="drp-grid"
        ref={gridRef}
        onMouseLeave={() => setHover(null)}
      >
        <div role="row" className="drp-weekdays">
          {weekdayOrder.map((dow) => (
            <div key={dow} role="columnheader" aria-label={WEEKDAY_NAMES[dow]}>
              {WEEKDAY_NAMES[dow].slice(0, 3)}
            </div>
          ))}
        </div>

        {grid.map((row, r) => (
          <div key={r} role="row" className="drp-week">
            {row.map((day, c) => {
              if (day === null) {
                // Padding keeps every row seven cells wide for the grid pattern.
                return <div key={`pad-${r}-${c}`} role="gridcell" className="drp-pad" />;
              }
              const selected = day === value.start || day === value.end;
              const disabled = isDisabled(day);
              return (
                <div
                  key={day}
                  role="gridcell"
                  className="drp-day"
                  aria-label={longDate(day)}
                  aria-selected={selected}
                  aria-disabled={disabled || undefined}
                  aria-current={day === today ? 'date' : undefined}
                  tabIndex={day === tabStop ? 0 : -1}
                  data-date={day}
                  data-in-range={isBetween(day, value.start, value.end) ? '' : undefined}
                  data-preview={isPreview(day) ? '' : undefined}
                  onClick={() => {
                    setCursor(day);
                    select(day);
                  }}
                  onMouseEnter={() => setHover(day)}
                  onKeyDown={(event) => onCellKeyDown(event, day)}
                >
                  {parseDay(day)[2]}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p role="status" className="drp-status">
        {statusText}
      </p>
    </div>
  );
}
