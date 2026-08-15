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
  // TODO: implement
  throw new Error('Not implemented');
}
