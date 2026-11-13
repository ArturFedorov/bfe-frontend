/**
 * 087. Quiet Hours Merge — reference solution
 *
 * normalize(windows)
 *   1. Validate bounds (0 <= start < 10080, start <= end <= start + 10080),
 *      throwing RangeError otherwise.
 *   2. Drop empty windows. Split each wrapping window (end > 10080) into
 *      [start, 10080) and [0, end - 10080) BEFORE sorting — that way merging
 *      is a single linear pass over start-sorted, non-wrapping pieces.
 *   3. Sort by start and sweep: a piece whose start is <= the current
 *      window's end overlaps or touches it, so extend `end` (the `<=` is what
 *      collapses adjacent windows); otherwise start a new window.
 *   New objects are created throughout, so the input is never mutated, and
 *   running normalize on its own output is a no-op (idempotent).
 *
 * isQuiet / nextAllowed
 *   Binary search for the LAST window with start <= m. The minute is quiet iff
 *   that window exists and m < its end. nextAllowed returns m when allowed;
 *   otherwise it jumps to `end % 10080`. One modulo wrap can land inside the
 *   window that begins at minute 0 (Sunday-night quiet continuing into
 *   Monday), so we resolve again from there. A second wrap would mean we
 *   came back around to where we started, which is only possible when the
 *   whole week is quiet — detected up front as a single [0, 10080) window
 *   (normalize always stitches a fully covered week into exactly that) and
 *   reported as RangeError.
 *
 * fromDate / toMinutes
 *   Pure conversions. JS `getUTCDay()` has Sunday = 0, so Monday-based day is
 *   (day + 6) % 7. toMinutes parses `Ddd HH:MM` with a strict regex and
 *   validates ranges.
 *
 * Time: normalize O(n log n); isQuiet / nextAllowed O(log n). Space: O(n).
 */

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

const DAY_MINUTES = 24 * 60;
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Splits wrapping windows, sorts by start, and merges overlapping and
 * adjacent windows. Result is sorted, disjoint, non-wrapping, with every
 * `start < end <= 10080`. Empty windows are dropped. Idempotent.
 * Throws RangeError on out-of-bounds input.
 */
export function normalize(windows: Window[]): Window[] {
  const pieces: Window[] = [];

  for (const { start, end } of windows) {
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      start >= WEEK_MINUTES ||
      end < start ||
      end > start + WEEK_MINUTES
    ) {
      throw new RangeError(`Invalid window [${start}, ${end})`);
    }
    if (end === start) continue; // empty

    if (end > WEEK_MINUTES) {
      // Wraps through Sunday midnight: split so every piece is non-wrapping.
      pieces.push({ start, end: WEEK_MINUTES });
      pieces.push({ start: 0, end: end - WEEK_MINUTES });
    } else {
      pieces.push({ start, end });
    }
  }

  pieces.sort((a, b) => a.start - b.start);

  const merged: Window[] = [];
  for (const piece of pieces) {
    const last = merged[merged.length - 1];
    if (last !== undefined && piece.start <= last.end) {
      // Overlapping or adjacent (`<=`): extend the current window.
      last.end = Math.max(last.end, piece.end);
    } else {
      merged.push({ start: piece.start, end: piece.end });
    }
  }

  return merged;
}

/** Index of the last window with start <= m, or -1. Binary search. */
function lastStartingAtOrBefore(normalized: Window[], m: number): number {
  let lo = 0;
  let hi = normalized.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (normalized[mid].start <= m) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/** The window covering `m`, or undefined. */
function coveringWindow(normalized: Window[], m: number): Window | undefined {
  const idx = lastStartingAtOrBefore(normalized, m);
  if (idx === -1) return undefined;
  const w = normalized[idx];
  return m < w.end ? w : undefined;
}

/** True when `minuteOfWeek` is inside one of the normalized windows (binary search). */
export function isQuiet(normalized: Window[], minuteOfWeek: number): boolean {
  return coveringWindow(normalized, minuteOfWeek) !== undefined;
}

/**
 * `minuteOfWeek` itself if allowed, otherwise the end of the covering
 * window modulo 10080 (Sunday night resolves to Monday morning).
 * Throws RangeError when the whole week is quiet.
 */
export function nextAllowed(
  normalized: Window[],
  minuteOfWeek: number,
): number {
  if (
    normalized.length === 1 &&
    normalized[0].start === 0 &&
    normalized[0].end === WEEK_MINUTES
  ) {
    throw new RangeError('Quiet hours cover the entire week');
  }

  let m = minuteOfWeek;
  // At most two hops: the covering window, then (after a wrap to Monday) the
  // window starting at minute 0, if any. A third hop is impossible unless the
  // week is fully quiet, which we have already excluded.
  for (let hop = 0; hop < 2; hop++) {
    const w = coveringWindow(normalized, m);
    if (w === undefined) return m;
    m = w.end % WEEK_MINUTES;
  }
  return m;
}

/** Minute-of-week for `date` using the UTC getters; Monday is day 0. */
export function fromDate(date: Date): number {
  const mondayBasedDay = (date.getUTCDay() + 6) % 7; // JS: Sunday = 0
  return (
    mondayBasedDay * DAY_MINUTES +
    date.getUTCHours() * 60 +
    date.getUTCMinutes()
  );
}

/** Parses `'Tue 22:00'` (Mon..Sun, 24h clock) into a minute-of-week. Throws RangeError. */
export function toMinutes(label: string): number {
  const match = /^(\w{3}) (\d{1,2}):(\d{2})$/.exec(label.trim());
  if (match === null) throw new RangeError(`Malformed label "${label}"`);

  const day = (DAY_NAMES as readonly string[]).indexOf(match[1]);
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  if (day === -1 || hours > 23 || minutes > 59) {
    throw new RangeError(`Malformed label "${label}"`);
  }

  return day * DAY_MINUTES + hours * 60 + minutes;
}
