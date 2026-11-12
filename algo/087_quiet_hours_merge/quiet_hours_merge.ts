/** Minutes in one week: 7 * 24 * 60. */
export const WEEK_MINUTES = 10080;

/**
 * A half-open quiet window `[start, end)` in minutes since Monday 00:00.
 * `0 <= start < 10080`; `end` may exceed 10080, meaning the window wraps
 * through Sunday midnight into Monday.
 */
export interface Window {
  start: number;
  end: number;
}

/**
 * Splits wrapping windows, sorts by start, and merges overlapping and
 * adjacent windows. Result is sorted, disjoint, non-wrapping, with every
 * `start < end <= 10080`. Empty windows are dropped. Idempotent.
 * Throws RangeError on out-of-bounds input.
 */
export function normalize(windows: Window[]): Window[] {
  // TODO: implement
  throw new Error('Not implemented');
}

/** True when `minuteOfWeek` is inside one of the normalized windows (binary search). */
export function isQuiet(normalized: Window[], minuteOfWeek: number): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * `minuteOfWeek` itself if allowed, otherwise the end of the covering
 * window modulo 10080 (Sunday night resolves to Monday morning).
 * Throws RangeError when the whole week is quiet.
 */
export function nextAllowed(normalized: Window[], minuteOfWeek: number): number {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Minute-of-week for `date` using the UTC getters; Monday is day 0. */
export function fromDate(date: Date): number {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Parses `'Tue 22:00'` (Mon..Sun, 24h clock) into a minute-of-week. Throws RangeError. */
export function toMinutes(label: string): number {
  // TODO: implement
  throw new Error('Not implemented');
}
