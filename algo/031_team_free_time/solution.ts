export interface Interval {
  start: number;
  end: number;
}

export function teamFreeTime(calendars: Interval[][]): Interval[] {
  const all = calendars.flat().sort((a, b) => a.start - b.start);
  const gaps: Interval[] = [];

  if (all.length === 0) return gaps;

  // Sweep merged busy time; any jump past the covered end is a team-wide gap.
  let coveredUntil = all[0].end;

  for (let i = 1; i < all.length; i++) {
    const { start, end } = all[i];

    if (start > coveredUntil) gaps.push({ start: coveredUntil, end: start });
    coveredUntil = Math.max(coveredUntil, end);
  }

  return gaps;
}
