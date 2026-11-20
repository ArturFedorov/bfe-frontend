/**
 * 063. Build Speed Watch — reference solution
 *
 * Keep a stack of day indices still waiting for a faster build; their times are
 * non-decreasing from bottom to top. Each new day pops every waiting day that
 * is strictly slower and records the distance.
 *
 * Time: O(n) — each index is pushed and popped at most once. Space: O(n).
 */
export function daysUntilFasterBuild(buildTimes: number[]): number[] {
  const result = new Array<number>(buildTimes.length).fill(0);
  const pending: number[] = [];

  for (let day = 0; day < buildTimes.length; day++) {
    while (
      pending.length > 0 &&
      buildTimes[pending[pending.length - 1]] > buildTimes[day]
    ) {
      const waiting = pending.pop() as number;
      result[waiting] = day - waiting;
    }
    pending.push(day);
  }

  return result;
}
