export type DependencyGraph = Record<string, string[]>;

/**
 * Returns true if package `a` depends on package `b`, directly or transitively.
 * Must be cycle-safe and never throw.
 */
export function hasDependency(
  graph: DependencyGraph,
  a: string,
  b: string,
): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}
