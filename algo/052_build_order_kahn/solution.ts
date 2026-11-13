/**
 * Build Order (Kahn's Algorithm) — reference solution.
 *
 * The manifest lists dependencies (node → what it needs), so we first invert
 * it into `dependents` (dep → nodes that need it) and compute each node's
 * in-degree = number of dependencies. Seed a queue with every zero-in-degree
 * target, then repeatedly dequeue a target, emit it, and decrement each
 * dependent's in-degree; a dependent whose count hits zero becomes buildable
 * and joins the queue. If the queue drains before every target is emitted,
 * the leftover targets all still have unmet dependencies — a cycle — so we
 * throw. Iteration follows `Object.keys` order, which makes the output
 * deterministic for a given input.
 *
 * Time:  O(V + E).
 * Space: O(V + E) for the inverted adjacency and in-degree map.
 */

export type DependencyGraph = Record<string, string[]>;

/**
 * Returns a build order in which every dependency appears before its dependents,
 * using Kahn's algorithm (in-degrees + queue).
 * Throws an Error if the graph contains a cycle.
 */
export function buildOrder(graph: DependencyGraph): string[] {
  const nodes = Object.keys(graph);
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node, graph[node].length);
    if (!dependents.has(node)) dependents.set(node, []);
  }
  for (const node of nodes) {
    for (const dep of graph[node]) {
      dependents.get(dep)!.push(node); // every dep is guaranteed to be a key
    }
  }

  // Seed with everything that has no dependencies (includes isolated targets).
  const queue: string[] = nodes.filter((node) => inDegree.get(node) === 0);
  const order: string[] = [];

  // Index-based queue: O(1) dequeue without Array#shift.
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    order.push(node);

    for (const dependent of dependents.get(node)!) {
      const remaining = inDegree.get(dependent)! - 1;
      inDegree.set(dependent, remaining);
      if (remaining === 0) queue.push(dependent);
    }
  }

  if (order.length !== nodes.length) {
    throw new Error('Dependency cycle detected: no valid build order exists');
  }

  return order;
}
