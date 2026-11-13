export type DependencyGraph = Record<string, string[]>;

/**
 * Returns a build order in which every dependency appears before its dependents.
 *
 * Method requirement (on your honor — tests only check observable output):
 * DFS post-order with three-color (white/gray/black) cycle detection.
 * Kahn's algorithm is forbidden for this task.
 *
 * Throws an Error if the graph contains a cycle.
 */
export function buildOrder(graph: DependencyGraph): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
