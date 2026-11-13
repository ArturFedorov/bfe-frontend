/**
 * 088. Journey Cycle Check — reference solution
 *
 * Shared prep (`buildAdjacency`): map each id to its index in `nodes`
 * (which doubles as the tie-break priority) and build an out-edge adjacency
 * list of indices, in `edges` order, skipping dangling edges. Duplicate edges
 * are kept — none of the algorithms below is confused by them.
 *
 * topoOrder — Kahn's algorithm with a binary MIN-HEAP of ready node indices.
 *   A FIFO queue gives *a* valid order; the heap guarantees that whenever
 *   several nodes have in-degree zero the one earliest in `nodes` is taken,
 *   which makes the output stable/diffable. If fewer than V nodes come out,
 *   a cycle exists → null.                                O((V + E) log V)
 *
 * findCycle — iterative three-colour DFS (white/grey/black) so a 100k-long
 *   chain cannot overflow the call stack. The grey nodes ARE the current DFS
 *   path; `posInPath[v]` records each grey node's position so that when an
 *   edge lands on a grey node we can slice the cycle out of the path in O(1)
 *   lookup time instead of searching or walking parent pointers. Nodes are
 *   started in `nodes` order and edges explored in `edges` order, so the
 *   "first cycle found" is deterministic. A black target is a cross/forward
 *   edge, not a cycle.                                        O(V + E)
 *
 * unreachable — plain BFS from `start` over the adjacency list with an
 *   array + head pointer as the queue; the result is every node whose
 *   visited flag is still false, in `nodes` order.             O(V + E)
 *
 * validate — partitions edges into dangling / clean (input order kept),
 *   then runs findCycle and unreachable on the cleaned graph.  O(V + E)
 *
 * Nothing mutates the input: we only read `g.nodes` / `g.edges` and build
 * fresh structures.
 */

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

interface Adjacency {
  /** id -> index in g.nodes */
  index: Map<string, number>;
  /** out-edges as node indices, in edge input order; dangling edges skipped */
  adj: number[][];
}

function buildAdjacency(g: Graph): Adjacency {
  const index = new Map<string, number>();
  g.nodes.forEach((id, i) => index.set(id, i));

  const adj: number[][] = Array.from({ length: g.nodes.length }, () => []);
  for (const [from, to] of g.edges) {
    const u = index.get(from);
    const v = index.get(to);
    if (u !== undefined && v !== undefined) adj[u].push(v);
  }
  return { index, adj };
}

/** Minimal binary min-heap of numbers (node indices). */
class MinHeap {
  private readonly a: number[] = [];

  get size(): number {
    return this.a.length;
  }

  push(x: number): void {
    const a = this.a;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (a[parent] <= a[i]) break;
      [a[parent], a[i]] = [a[i], a[parent]];
      i = parent;
    }
  }

  pop(): number {
    const a = this.a;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let smallest = i;
        if (l < a.length && a[l] < a[smallest]) smallest = l;
        if (r < a.length && a[r] < a[smallest]) smallest = r;
        if (smallest === i) break;
        [a[smallest], a[i]] = [a[i], a[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

/**
 * Kahn's algorithm. Returns a topological order, or null if a cycle exists.
 * Among ready nodes, always pick the one earliest in `g.nodes`.
 * Dangling edges are skipped.
 */
export function topoOrder(g: Graph): string[] | null {
  const n = g.nodes.length;
  const { adj } = buildAdjacency(g);

  const inDegree = new Int32Array(n);
  for (const targets of adj) for (const v of targets) inDegree[v]++;

  const ready = new MinHeap();
  for (let i = 0; i < n; i++) if (inDegree[i] === 0) ready.push(i);

  const order: string[] = [];
  while (ready.size > 0) {
    const u = ready.pop();
    order.push(g.nodes[u]);
    for (const v of adj[u]) {
      if (--inDegree[v] === 0) ready.push(v);
    }
  }

  return order.length === n ? order : null;
}

const WHITE = 0;
const GREY = 1;
const BLACK = 2;

/**
 * Three-colour DFS (nodes in input order, edges in input order). Returns the
 * first cycle found as a path that starts and ends with the back-edge target,
 * e.g. ['b', 'c', 'b'], or null when acyclic. Dangling edges are skipped.
 */
export function findCycle(g: Graph): string[] | null {
  const n = g.nodes.length;
  const { adj } = buildAdjacency(g);

  const colour = new Uint8Array(n); // WHITE by default
  const nextEdge = new Int32Array(n); // per-node cursor into adj[u]
  const posInPath = new Int32Array(n).fill(-1);
  const path: number[] = []; // the grey nodes, root → current

  const enter = (u: number): void => {
    colour[u] = GREY;
    posInPath[u] = path.length;
    path.push(u);
  };

  for (let s = 0; s < n; s++) {
    if (colour[s] !== WHITE) continue;
    enter(s);

    while (path.length > 0) {
      const u = path[path.length - 1];

      if (nextEdge[u] < adj[u].length) {
        const v = adj[u][nextEdge[u]++];
        if (colour[v] === WHITE) {
          enter(v);
        } else if (colour[v] === GREY) {
          // Back edge u → v: the cycle is the grey path from v to u, then v.
          const cycle = path.slice(posInPath[v]).map((i) => g.nodes[i]);
          cycle.push(g.nodes[v]);
          return cycle;
        }
        // BLACK: cross/forward edge — not a cycle.
      } else {
        colour[u] = BLACK;
        posInPath[u] = -1;
        path.pop();
      }
    }
  }

  return null;
}

/**
 * BFS from `start`. Returns ids never reached, in input order.
 * Throws RangeError when `start` is not a node.
 */
export function unreachable(g: Graph, start: string): string[] {
  const { index, adj } = buildAdjacency(g);
  const s = index.get(start);
  if (s === undefined) throw new RangeError(`Unknown start node "${start}"`);

  const seen = new Uint8Array(g.nodes.length);
  const queue: number[] = [s];
  seen[s] = 1;
  for (let head = 0; head < queue.length; head++) {
    for (const v of adj[queue[head]]) {
      if (!seen[v]) {
        seen[v] = 1;
        queue.push(v);
      }
    }
  }

  return g.nodes.filter((_, i) => !seen[i]);
}

/**
 * Reports dangling edges, then runs cycle and reachability checks on the
 * graph with those edges removed. Throws RangeError when `start` is unknown.
 */
export function validate(g: Graph, start: string): ValidationResult {
  const known = new Set(g.nodes);
  if (!known.has(start)) throw new RangeError(`Unknown start node "${start}"`);

  const danglingEdges: Array<[string, string]> = [];
  const cleanEdges: Array<[string, string]> = [];
  for (const edge of g.edges) {
    (known.has(edge[0]) && known.has(edge[1])
      ? cleanEdges
      : danglingEdges
    ).push(edge);
  }

  const cleaned: Graph = { nodes: g.nodes, edges: cleanEdges };
  return {
    cycle: findCycle(cleaned),
    unreachable: unreachable(cleaned, start),
    danglingEdges,
  };
}
