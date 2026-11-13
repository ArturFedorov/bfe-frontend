/**
 * Merge Busy Slots — reference solution.
 *
 * Sort a copy by `start`, then sweep once keeping the current open block.
 * A slot whose start is <= the open block's end overlaps or touches it
 * (half-open intervals: `end === start` leaves no free minute), so the block
 * simply extends; otherwise the block is finalized and a new one begins.
 * Fresh objects are pushed so the input is never mutated.
 *
 * Time:  O(n log n) for the sort, O(n) for the sweep.
 * Space: O(n) for the sorted copy and the result.
 */

export interface Interval {
  start: number;
  end: number;
}

export function mergeBusySlots(slots: Interval[]): Interval[] {
  if (slots.length === 0) return [];

  const sorted = [...slots].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const slot = sorted[i];
    const current = merged[merged.length - 1];

    if (slot.start <= current.end) {
      // Overlapping or touching: extend (a nested slot may not extend at all).
      current.end = Math.max(current.end, slot.end);
    } else {
      merged.push({ ...slot });
    }
  }

  return merged;
}
