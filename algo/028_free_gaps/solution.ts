export interface Interval {
  start: number;
  end: number;
}

export function freeGaps(
  booked: Interval[],
  hours: Interval,
  minMinutes: number,
): Interval[] {
  const sorted = [...booked].sort((a, b) => a.start - b.start);
  const gaps: Interval[] = [];

  // cursor is the earliest minute not yet covered by a booking.
  let cursor = hours.start;

  const addGap = (start: number, end: number): void => {
    if (end - start >= minMinutes) gaps.push({ start, end });
  };

  for (const { start, end } of sorted) {
    if (start >= hours.end) break;
    if (end <= cursor) continue;

    if (start > cursor) addGap(cursor, start);
    cursor = Math.min(end, hours.end);
  }

  if (cursor < hours.end) addGap(cursor, hours.end);

  return gaps;
}
