/** A customer journey: step ids plus directed `[from, to]` arrows. */
export interface Graph {
  nodes: string[];
  edges: Array<[from: string, to: string]>;
}

export interface ValidationResult {
  /** One cycle as a path starting and ending with the same id, or null. */
  cycle: string[] | null;
  /** Ids not reachable from `start`, in input order. */
  unreachable: string[];
  /** Edges (input order) whose `from` or `to` is not a known node. */
  danglingEdges: Array<[string, string]>;
}

/**
 * Kahn's algorithm. Returns a topological order, or null if a cycle exists.
 * Among ready nodes, always pick the one earliest in `g.nodes`.
 * Dangling edges are skipped.
 */
export function topoOrder(g: Graph): string[] | null {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Three-colour DFS (nodes in input order, edges in input order). Returns the
 * first cycle found as a path that starts and ends with the back-edge target,
 * e.g. ['b', 'c', 'b'], or null when acyclic. Dangling edges are skipped.
 */
export function findCycle(g: Graph): string[] | null {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * BFS from `start`. Returns ids never reached, in input order.
 * Throws RangeError when `start` is not a node.
 */
export function unreachable(g: Graph, start: string): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Reports dangling edges, then runs cycle and reachability checks on the
 * graph with those edges removed. Throws RangeError when `start` is unknown.
 */
export function validate(g: Graph, start: string): ValidationResult {
  // TODO: implement
  throw new Error('Not implemented');
}
