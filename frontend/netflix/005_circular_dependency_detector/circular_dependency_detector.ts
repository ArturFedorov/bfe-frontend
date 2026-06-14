export type Graph = Record<string, string[]>;

/**
 * Detect all cycles in a directed graph.
 * Return an array of cycles, each cycle being the list of nodes in order.
 * Return an empty array when the graph is acyclic.
 */
export function findCycles(graph: Graph): string[][] {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]) {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      const cycle = [...path.slice(cycleStart), node];
      cycles.push(cycle);
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    for (const dep of graph[node]) {
      dfs(dep, path);
    }

    path.pop();
    inStack.delete(node);
  }

  for (const node of Object.keys(graph)) {
    dfs(node, []);
  }

  return cycles;
}
