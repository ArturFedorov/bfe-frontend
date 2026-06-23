export interface PackageGraph {
  // package name -> list of internal packages it depends on
  [pkg: string]: string[];
}

export interface CiPlan {
  affected: string[]; // packages to build/test
}

/**
 * Generate a CI plan covering the changed packages plus every package that
 * depends on them, transitively (reverse-dependency traversal).
 */
export function generateCiPlan(
  graph: PackageGraph,
  changedPackages: string[],
): CiPlan {
  // TODO: implement
  throw new Error('Not implemented');
}
