/**
 * Min Coverage Window — reference solution.
 *
 * Classic minimum-window-substring pattern with need/have bookkeeping:
 *  - `need` counts how many of each required type the window must contain.
 *  - `have` counts how many *distinct* required types are currently satisfied
 *    (window count >= need count). Coverage holds when `have === need.size`.
 *  - Expand `right`; once covered, contract `left` as far as possible,
 *    recording the window each time it is still covered. Strict `<` on the
 *    length comparison keeps the earliest start on ties (the window found
 *    first for a given length always has the smaller start).
 *
 * Time:  O(n + r) — each index enters and leaves the window at most once.
 * Space: O(r) — maps sized by the number of distinct required types.
 */

/**
 * Finds the shortest contiguous window of the event log that contains
 * every required event type (with multiplicity: a type listed twice in
 * `required` must occur at least twice in the window).
 *
 * @param events - event types in time order
 * @param required - required event types; duplicates demand extra occurrences
 * @returns inclusive `[start, end]` of the shortest covering window
 *          (earliest start on ties), or `null` when coverage is impossible,
 *          `required` is empty, or `events` is empty
 */
export function minCoverageWindow(
  events: string[],
  required: string[],
): [number, number] | null {
  if (events.length === 0 || required.length === 0) return null;

  const need = new Map<string, number>();
  for (const type of required) {
    need.set(type, (need.get(type) ?? 0) + 1);
  }

  const window = new Map<string, number>();
  let have = 0; // distinct required types whose count requirement is met
  let bestStart = -1;
  let bestLen = Infinity;
  let left = 0;

  for (let right = 0; right < events.length; right++) {
    const type = events[right];
    const needed = need.get(type);
    if (needed !== undefined) {
      const count = (window.get(type) ?? 0) + 1;
      window.set(type, count);
      if (count === needed) have++;
    }

    // Contract while the window still covers everything.
    while (have === need.size) {
      const len = right - left + 1;
      if (len < bestLen) {
        bestLen = len;
        bestStart = left;
      }

      const outgoing = events[left];
      const outNeeded = need.get(outgoing);
      if (outNeeded !== undefined) {
        const count = window.get(outgoing)! - 1;
        window.set(outgoing, count);
        if (count < outNeeded) have--;
      }
      left++;
    }
  }

  return bestStart === -1 ? null : [bestStart, bestStart + bestLen - 1];
}
