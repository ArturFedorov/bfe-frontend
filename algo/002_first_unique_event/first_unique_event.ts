export function firstUniqueEvent(events: string[]): string | null {
  const dict: Map<string, number> = new Map<string, number>();

  for (const event of events) {
    dict.set(event, (dict.get(event) ?? 0) + 1);
  }

  for (const [event, count] of dict) {
    if (count === 1) return event;
  }

  return null;
}
