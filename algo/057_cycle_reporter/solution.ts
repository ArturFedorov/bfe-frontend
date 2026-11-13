/**
 * Cycle Reporter — reference solution.
 *
 * Three-color DFS that also keeps the *current path* as an explicit stack
 * (`path`) plus each gray node's index in it (`indexOnPath`). Stepping onto a
 * gray node `g` means the stack from `g`'s position to the top is a walk
 * g -> ... -> current, and `current` depends on `g`, so slicing the stack at
 * `indexOnPath[g]` and appending `g` yields a simple cycle. The visited
 * (black) set alone cannot do this: it records *that* a node was seen, not
 * the order of the path that is still open, and black nodes may be re-reached
 * legitimately via shared dependencies. Driving the search from
 * `Object.keys` order keeps the result deterministic.
 *
 * Time:  O(V + E) — each node is entered once; each edge examined once.
 * Space: O(V) for the color map, path stack and recursion depth (bounded by
 *        the longest dependency chain).
 */

export type DependencyGraph = Record<string, string[]>;

type Color = 'gray' | 'black'; // white = absent from the map

/**
 * Returns one actual dependency cycle as a path of node ids, e.g.
 * ['a', 'b', 'c', 'a'] where each element depends on the next and the first
 * equals the last. Returns null if the graph is acyclic.
 * Any valid simple cycle is accepted.
 */
export function findCycle(graph: DependencyGraph): string[] | null {
  const colors = new Map<string, Color>();
  const path: string[] = []; // the gray stack, root -> current
  const indexOnPath = new Map<string, number>();

  /** Returns the cycle found under `node`, or null if its subtree is acyclic. */
  const visit = (node: string): string[] | null => {
    colors.set(node, 'gray');
    indexOnPath.set(node, path.length);
    path.push(node);

    for (const dep of graph[node] ?? []) {
      const color = colors.get(dep);
      if (color === 'black') continue; // finished subtree, safe to re-reach

      if (color === 'gray') {
        // Back edge: everything from `dep`'s slot to the top is the cycle,
        // closed by repeating `dep` (a self-loop gives [dep, dep]).
        return [...path.slice(indexOnPath.get(dep)!), dep];
      }

      const cycle = visit(dep);
      if (cycle !== null) return cycle;
    }

    path.pop();
    indexOnPath.delete(node);
    colors.set(node, 'black');
    return null;
  };

  for (const node of Object.keys(graph)) {
    if (colors.has(node)) continue;
    const cycle = visit(node);
    if (cycle !== null) return cycle;
  }

  return null;
}
