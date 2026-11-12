/**
 * Milestone 6a — send scheduling: quiet hours as minutes-of-week ranges and
 * recurrence expansion in a timezone (via Intl, no libraries).
 * See README.md in this folder. Tests: schedule.test.ts.
 */

export const MINUTES_PER_DAY = 1440;
export const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

/** 0 = Sunday … 6 = Saturday (same as `Date#getDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface QuietHours {
  /** Days the window applies to. Empty array = every day. */
  days: Weekday[];
  /** `HH:mm`, inclusive start. */
  start: string;
  /** `HH:mm`, exclusive end. `end <= start` means the window wraps past midnight into the next day. */
  end: string;
}

/** Half-open range `[start, end)` in minutes of the week, 0 ≤ start < end ≤ MINUTES_PER_WEEK. */
export interface MinuteRange {
  start: number;
  end: number;
}

export type Recurrence = 'once' | 'daily' | 'weekly';

export interface Schedule {
  /** IANA zone, e.g. `America/New_York`. Local times below are in this zone. */
  timezone: string;
  /** First day the schedule is active, `YYYY-MM-DD` in `timezone`. */
  startDate: string;
  /** Local send time, `HH:mm`. */
  time: string;
  recurrence: Recurrence;
  /** `weekly` only: which days. */
  weekdays?: Weekday[];
  quietHours: QuietHours[];
}

/** Broken-down local time in a zone, computed with `Intl.DateTimeFormat`. */
export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  weekday: Weekday;
}

export function parseHHmm(value: string): number {
  void value;
  throw new Error('Not implemented');
}

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  void date;
  void timeZone;
  throw new Error('Not implemented');
}

/**
 * The instant at which the wall clock in `timeZone` reads the given parts.
 * During a DST gap (non-existent local time) return the instant one hour later;
 * during an overlap return the earlier instant.
 */
export function zonedTimeToUtc(
  parts: Omit<ZonedParts, 'weekday'>,
  timeZone: string,
): Date {
  void parts;
  void timeZone;
  throw new Error('Not implemented');
}

/** Minutes since Sunday 00:00 in the zone's wall-clock time. */
export function minuteOfWeek(date: Date, timeZone: string): number {
  void date;
  void timeZone;
  throw new Error('Not implemented');
}

/**
 * Expands quiet-hour windows to sorted, non-overlapping, merged minute ranges.
 * Windows that wrap midnight split across the day boundary; a Saturday window
 * that wraps lands partly on Sunday (start of the week). Adjacent ranges merge.
 */
export function normalizeQuietHours(windows: QuietHours[]): MinuteRange[] {
  void windows;
  throw new Error('Not implemented');
}

/** Binary search over normalised ranges. `minute` is taken modulo the week. */
export function isQuiet(ranges: MinuteRange[], minute: number): boolean {
  void ranges;
  void minute;
  throw new Error('Not implemented');
}

/**
 * The first minute ≥ `minute` (mod week) that is not quiet. Returns `minute`
 * itself when it is allowed. Throws if the ranges cover the whole week.
 */
export function nextAllowed(ranges: MinuteRange[], minute: number): number {
  void ranges;
  void minute;
  throw new Error('Not implemented');
}

/**
 * The next `count` send instants strictly after `now`, in order:
 *  - candidate = schedule.time on each active day (startDate onwards; `once` has a single candidate);
 *  - candidates inside quiet hours are pushed to the next allowed minute of the same week;
 *  - two candidates that collapse onto the same instant are de-duplicated.
 * `once` returns at most one date.
 */
export function nextSends(
  schedule: Schedule,
  now: Date,
  count: number,
): Date[] {
  void schedule;
  void now;
  void count;
  throw new Error('Not implemented');
}
