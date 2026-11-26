export interface TimelineEvent {
  name: string;
  date: number;
  priority: number;
}

function compareEvents(a: TimelineEvent, b: TimelineEvent): number {
  if (a.date !== b.date) return a.date - b.date;
  if (a.priority !== b.priority) return b.priority - a.priority;
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
}

export function sortTimeline(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort(compareEvents);
}
