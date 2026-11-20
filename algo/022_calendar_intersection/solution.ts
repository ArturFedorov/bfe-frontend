export interface Interval {
  start: number;
  end: number;
}

export function calendarIntersection(a: Interval[], b: Interval[]): Interval[] {
  const result: Interval[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    const start = Math.max(a[i].start, b[j].start);
    const end = Math.min(a[i].end, b[j].end);

    if (start < end) result.push({ start, end });

    // The interval that ends first cannot overlap anything further on the other side.
    if (a[i].end < b[j].end) {
      i++;
    } else {
      j++;
    }
  }

  return result;
}
