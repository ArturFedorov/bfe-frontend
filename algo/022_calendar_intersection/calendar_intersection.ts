export interface Interval {
  start: number;
  end: number;
}

/**
 * Finds every slot where both calendars are busy at the same time.
 *
 * Each calendar is sorted by start and non-overlapping within itself.
 * Only positive-duration overlaps count: intervals that merely touch at
 * an endpoint share no time. Inputs are not mutated.
 *
 * @param a - first person's busy intervals, sorted, non-overlapping
 * @param b - second person's busy intervals, sorted, non-overlapping
 * @returns overlapping slots sorted by start, each with start < end
 */
export function calendarIntersection(a: Interval[], b: Interval[]): Interval[] {
  // TODO: implement
  throw new Error('Not implemented');
}
