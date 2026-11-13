export type Graph = Record<string, string[]>;

/**
 * Return every package reachable from `start` (direct + transitive),
 * excluding `start` itself. Order does not matter.
 */
export function findTransitive(graph: Graph, start: string): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
