/**
 * Event Timeline — reference solution.
 *
 * A three-key comparator applied via the engine's stable sort (stability is
 * guaranteed by the ECMAScript spec since ES2019). Each key is consulted only
 * when every earlier key tied, so a later key can never override an earlier
 * one. Copying the input first keeps the function pure.
 *
 * Time:  O(n log n).
 * Space: O(n) for the returned copy.
 */

export interface TimelineEvent {
  name: string;
  date: number;
  priority: number;
}

/** date ASC, then priority DESC, then name ASC (plain code-unit comparison). */
function compareEvents(a: TimelineEvent, b: TimelineEvent): number {
  if (a.date !== b.date) return a.date - b.date;
  if (a.priority !== b.priority) return b.priority - a.priority;
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0; // fully equal: stable sort preserves input order
}

export function sortTimeline(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort(compareEvents);
}
