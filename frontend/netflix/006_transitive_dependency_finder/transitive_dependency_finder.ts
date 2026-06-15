export type Graph = Record<string, string[]>;

/**
 * Return every package reachable from `start` (direct + transitive),
 * excluding `start` itself. Order does not matter.
 */
export function findTransitive(graph: Graph, start: string): string[] {
  const result: Set<string> = new Set();
  const queue: string[] = [start];

  const visited: Set<string> = new Set();

  while (queue.length > 0) {
    const node = queue.shift() as string;

    if (visited.has(node)) {
      continue;
    }

    visited.add(node);

    const neighbours = graph[node] || [];

    for (const dep of neighbours) {
      if (dep !== start) {
        result.add(dep);
      }

      queue.push(dep);
    }
  }

  return Array.from(result);
}
