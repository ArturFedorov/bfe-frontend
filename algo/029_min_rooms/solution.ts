/**
 * Minimum Meeting Rooms — reference solution.
 *
 * Sweep line over two independently sorted arrays: all start minutes and all
 * end minutes. Walk the starts in order; before seating a start, release every
 * meeting whose end is <= that start (half-open intervals, so an end that
 * coincides with a start frees the room first). The number of concurrently
 * seated meetings peaks at the answer.
 *
 * The alternative is a min-heap of end times: for each start (sorted), pop
 * ends <= start, push the new end; the heap's max size is the answer. Both
 * are O(n log n); the two-array sweep avoids writing a heap.
 *
 * Time:  O(n log n) for the two sorts; the sweep is O(n).
 * Space: O(n) for the two sorted arrays (input left untouched).
 */

export interface Interval {
  start: number;
  end: number;
}

export function minRooms(meetings: Interval[]): number {
  const starts = meetings.map((m) => m.start).sort((a, b) => a - b);
  const ends = meetings.map((m) => m.end).sort((a, b) => a - b);

  let rooms = 0;
  let peak = 0;
  let endIdx = 0;

  for (const start of starts) {
    // Free every room whose meeting has finished by this minute.
    while (endIdx < ends.length && ends[endIdx] <= start) {
      rooms--;
      endIdx++;
    }
    rooms++;
    peak = Math.max(peak, rooms);
  }

  return peak;
}
