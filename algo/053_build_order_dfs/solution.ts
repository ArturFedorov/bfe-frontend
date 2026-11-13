/**
 * Build Order (DFS Three-Color) — reference solution.
 *
 * Post-order DFS with white/gray/black marking:
 *  - white (absent from the map): never visited;
 *  - gray: on the current DFS path — reaching a gray node means we walked
 *    back onto our own path, i.e. a dependency cycle, so we throw;
 *  - black: fully processed — safe to re-reach (a shared dependency).
 * A node is pushed to `order` only after all of its dependencies have been
 * pushed (post-order), so the list is already a valid build order. Driving
 * the DFS from `Object.keys` order keeps the output deterministic.
 *
 * Time:  O(V + E).
 * Space: O(V) for the color map, output and recursion stack.
 */

export type DependencyGraph = Record<string, string[]>;

/** White is represented by absence from the map. */
type Color = 'gray' | 'black';

/**
 * Returns a build order in which every dependency appears before its dependents.
 *
 * Method requirement (on your honor — tests only check observable output):
 * DFS post-order with three-color (white/gray/black) cycle detection.
 * Kahn's algorithm is forbidden for this task.
 *
 * Throws an Error if the graph contains a cycle.
 */
export function buildOrder(graph: DependencyGraph): string[] {
  const colors = new Map<string, Color>();
  const order: string[] = [];

  const visit = (node: string): void => {
    const color = colors.get(node);

    if (color === 'black') return; // already built — shared dependency
    if (color === 'gray') {
      throw new Error(`Dependency cycle detected at "${node}"`);
    }

    colors.set(node, 'gray'); // entering: node is now on the DFS path
    for (const dep of graph[node] ?? []) {
      visit(dep);
    }

    colors.set(node, 'black'); // leaving: all dependencies are done
    order.push(node);
  };

  for (const node of Object.keys(graph)) {
    visit(node);
  }

  return order;
}
