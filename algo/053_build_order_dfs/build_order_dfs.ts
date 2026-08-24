export type DependencyGraph = Record<string, string[]>;
type Color = 'black' | 'gray';
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

    if (color === 'black') return;
    if (color === 'gray')
      throw new Error(`Cycle dependency is detected with ${node}`);

    colors.set(node, 'gray');
    for (const dep of graph[node] ?? []) {
      visit(dep);
    }

    colors.set(node, 'black');
    order.push(node);
  };

  for (const node of Object.keys(graph)) {
    visit(node);
  }

  return order;
}
