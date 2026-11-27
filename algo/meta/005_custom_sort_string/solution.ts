/** Permutes `s` so that characters appearing in `order` follow that order. */
export function customSortString(order: string, s: string): string {
  // Counting sort: emit ranked chars in `order` sequence, then the leftovers.
  const counts = new Map<string, number>();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);

  const parts: string[] = [];
  for (const ch of order) {
    const count = counts.get(ch);
    if (count) {
      parts.push(ch.repeat(count));
      counts.delete(ch);
    }
  }
  for (const [ch, count] of counts) parts.push(ch.repeat(count));
  return parts.join('');
}
