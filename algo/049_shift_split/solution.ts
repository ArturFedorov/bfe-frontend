export type Conflict = [string, string];

export function canSplitShifts(
  employees: string[],
  conflicts: Conflict[],
): boolean {
  const graph = new Map<string, string[]>();
  for (const id of employees) graph.set(id, []);
  for (const [a, b] of conflicts) {
    graph.get(a)!.push(b);
    graph.get(b)!.push(a);
  }

  // 2-color each component with BFS; a same-colored edge means an odd cycle.
  const color = new Map<string, 0 | 1>();

  for (const start of employees) {
    if (color.has(start)) continue;
    color.set(start, 0);
    const queue: string[] = [start];

    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      const currentColor = color.get(current)!;

      for (const next of graph.get(current)!) {
        const nextColor = color.get(next);
        if (nextColor === undefined) {
          color.set(next, currentColor === 0 ? 1 : 0);
          queue.push(next);
        } else if (nextColor === currentColor) {
          return false;
        }
      }
    }
  }

  return true;
}
