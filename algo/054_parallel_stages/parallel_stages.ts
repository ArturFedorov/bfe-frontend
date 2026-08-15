export type DependencyGraph = Record<string, string[]>;

/**
 * Groups build targets into stages where every target in a stage can build
 * concurrently: a target's stage is 1 + the max stage of its dependencies.
 * Each stage is sorted alphabetically for determinism.
 * Throws an Error if the graph contains a cycle.
 */
export function parallelStages(graph: DependencyGraph): string[][] {
  // TODO: implement
  throw new Error('Not implemented');
}
