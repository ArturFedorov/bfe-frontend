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
  if (!Object.hasOwn(graph, a) || !Object.hasOwn(graph, b)) return false;

  // Start from a's direct deps so that a === b requires at least one edge.
  const visited = new Set<string>();
  const stack: string[] = [...graph[a]];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === b) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const dep of graph[current] ?? []) {
      if (!visited.has(dep)) stack.push(dep);
    }
  }

  return false;
}
