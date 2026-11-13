/**
 * Insert Meeting — reference solution.
 *
 * Three-phase single pass over the already-merged calendar:
 *  1. Copy every block that ends strictly before the meeting starts.
 *  2. Absorb every block that overlaps or touches the meeting
 *     (`block.start <= meeting.end` and `block.end >= meeting.start`),
 *     widening the meeting to the union.
 *  3. Push the widened meeting, then copy the remaining blocks.
 *
 * The calendar is sorted and disjoint, so once a block starts after the
 * meeting ends every later block does too — no re-sorting needed.
 *
 * Time:  O(n).
 * Space: O(n) for the result.
 */

export interface Interval {
  start: number;
  end: number;
}

export function insertMeeting(
  calendar: Interval[],
  meeting: Interval,
): Interval[] {
  const result: Interval[] = [];
  let { start, end } = meeting;
  let i = 0;

  // 1. Blocks entirely before the meeting (a gap > 0 between them).
  while (i < calendar.length && calendar[i].end < start) {
    result.push({ ...calendar[i] });
    i++;
  }

  // 2. Blocks that overlap or touch the meeting: merge into one span.
  while (i < calendar.length && calendar[i].start <= end) {
    start = Math.min(start, calendar[i].start);
    end = Math.max(end, calendar[i].end);
    i++;
  }
  result.push({ start, end });

  // 3. Blocks entirely after the meeting.
  while (i < calendar.length) {
    result.push({ ...calendar[i] });
    i++;
  }

  return result;
}
