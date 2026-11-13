import type { JSX } from 'react';

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

/** Number of days in `month` (1–12) of `year`, Gregorian leap rules. */
export function daysInMonth(year: number, month: number): number {
  throw new Error('Not implemented');
}

/**
 * 6 rows × 7 columns of `YYYY-MM-DD` with `null` for the leading/trailing cells
 * that belong to other months. Column 0 is `weekStartsOn`.
 */
export function monthGrid(year: number, month: number, weekStartsOn: WeekStart): (string | null)[][] {
  throw new Error('Not implemented');
}

/** True when `day` lies strictly between `start` and `end` (either order). False when either bound is null. */
export function isBetween(day: string, start: string | null, end: string | null): boolean {
  throw new Error('Not implemented');
}

/** `'2026-12' + 1 → '2027-01'`; `n` may be negative. */
export function addMonths(ym: string, n: number): string {
  throw new Error('Not implemented');
}

export function DateRangePicker(props: DateRangePickerProps): JSX.Element {
  throw new Error('Not implemented');
}
