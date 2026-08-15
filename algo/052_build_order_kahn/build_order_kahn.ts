export type DependencyGraph = Record<string, string[]>;

/**
 * Returns a build order in which every dependency appears before its dependents,
 * using Kahn's algorithm (in-degrees + queue).
 * Throws an Error if the graph contains a cycle.
 */
export function buildOrder(graph: DependencyGraph): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
