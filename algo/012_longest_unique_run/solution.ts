/**
 * Longest Unique Run — reference solution.
 *
 * Variable-size sliding window over the log. `lastSeen` maps each client id
 * to the index of its most recent occurrence. When the id at `right` was
 * last seen inside the current window (`lastSeen >= left`), the window's
 * left edge jumps to just past that occurrence, which evicts the duplicate
 * in O(1) instead of shrinking one step at a time.
 *
 * Time:  O(n) — each index is visited once by `right`; `left` only moves forward.
 * Space: O(k) — k = number of distinct ids (bounded by n).
 */

/**
 * Returns the length of the longest contiguous run of requests with no
 * repeated client id.
 *
 * @param clientIds - client id per request, in arrival order
 * @returns length of the longest duplicate-free run (0 for an empty log)
 */
export function longestUniqueRun(clientIds: string[]): number {
  const lastSeen = new Map<string, number>();
  let left = 0;
  let best = 0;

  for (let right = 0; right < clientIds.length; right++) {
    const id = clientIds[right];
    const prev = lastSeen.get(id);

    // A repeat *inside* the window invalidates everything up to and
    // including the earlier occurrence; repeats before `left` are harmless.
    if (prev !== undefined && prev >= left) {
      left = prev + 1;
    }

    lastSeen.set(id, right);
    best = Math.max(best, right - left + 1);
  }

  return best;
}
