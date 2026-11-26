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
      current.end = Math.max(current.end, slot.end);
    } else {
      merged.push({ ...slot });
    }
  }

  return merged;
}
