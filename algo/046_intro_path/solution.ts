export type Connection = [string, string];

export function introPath(
  connections: Connection[],
  from: string,
  to: string,
): string[] | null {
  if (from === to) return [from];

  const graph = new Map<string, string[]>();
  const link = (a: string, b: string): void => {
    const neighbors = graph.get(a);
    if (neighbors) neighbors.push(b);
    else graph.set(a, [b]);
  };

  for (const [a, b] of connections) {
    link(a, b);
    link(b, a);
  }

  if (!graph.has(from) || !graph.has(to)) return null;

  // Parent pointers double as the visited set.
  const parent = new Map<string, string | null>([[from, null]]);
  const queue: string[] = [from];

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];

    for (const next of graph.get(current)!) {
      if (parent.has(next)) continue;
      parent.set(next, current);

      if (next === to) {
        const path: string[] = [];
        for (
          let node: string | null = to;
          node !== null;
          node = parent.get(node)!
        ) {
          path.push(node);
        }
        return path.reverse();
      }

      queue.push(next);
    }
  }

  return null;
}
