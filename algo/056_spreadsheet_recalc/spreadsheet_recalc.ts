export type DependencyGraph = Record<string, string[]>;

/**
 * Given a sheet mapping each cell to the cells its formula reads, and the id of
 * a changed cell, returns ONLY the affected cells (transitive dependents of the
 * changed cell, excluding the changed cell itself) in a valid recompute order:
 * every affected cell appears after every affected cell it reads from.
 * Throws an Error if a circular reference involves the affected cells.
 */
export function recalcOrder(sheet: DependencyGraph, changed: string): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
