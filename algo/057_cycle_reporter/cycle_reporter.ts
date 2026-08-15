export type DependencyGraph = Record<string, string[]>;

/**
 * Returns one actual dependency cycle as a path of node ids, e.g.
 * ['a', 'b', 'c', 'a'] where each element depends on the next and the first
 * equals the last. Returns null if the graph is acyclic.
 * Any valid simple cycle is accepted.
 */
export function findCycle(graph: DependencyGraph): string[] | null {
  // TODO: implement
  throw new Error('Not implemented');
}
