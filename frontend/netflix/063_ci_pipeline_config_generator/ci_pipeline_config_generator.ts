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
  const dependents = new Map<string, string[]>();

  for (const pkg of Object.keys(graph)) {
    for (const dep of graph[pkg]) {
      if (!dependents.has(dep)) dependents.set(dep, []);
      dependents.get(dep)!.push(pkg);
    }
  }

  const affected = new Set<string>();
  const queue = [...changedPackages];

  while (queue.length > 0) {
    const pkg = queue.shift()!;
    if (affected.has(pkg)) continue;

    affected.add(pkg);

    for (const dependent of dependents.get(pkg) ?? []) {
      if (!affected.has(dependent)) queue.push(dependent);
    }
  }

  return { affected: Array.from(affected) };
}
