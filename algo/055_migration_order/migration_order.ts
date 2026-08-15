export type DependencyGraph = Record<string, string[]>;

/**
 * Returns the unique deterministic migration order: a migration is ready once
 * all of its dependencies are emitted, and among ready migrations the
 * lexicographically smallest id is always emitted first.
 * Throws an Error if the graph contains a cycle.
 */
export function migrationOrder(graph: DependencyGraph): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
