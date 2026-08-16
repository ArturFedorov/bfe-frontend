export function firstUniqueEvent(events: string[]): string | null {
  const lookUp = new Map<string, number>();

  for (const event of events) {
    const value = lookUp.get(event) || 0;
    lookUp.set(event, value + 1);
  }

  for (const [event, count] of lookUp) {
    if (count === 1) return event;
  }

  return null;
}
