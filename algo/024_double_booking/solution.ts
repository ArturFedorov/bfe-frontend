export interface Interval {
  start: number;
  end: number;
}

export function hasDoubleBooking(meetings: Interval[]): boolean {
  const sorted = [...meetings].sort((a, b) => a.start - b.start);

  // After sorting by start, any conflict shows up between neighbours.
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < sorted[i - 1].end) return true;
  }

  return false;
}
