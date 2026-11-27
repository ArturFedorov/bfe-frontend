import { GraphNode, cloneGraph } from './clone_graph';

/** Build from a 1-indexed adjacency list; returns all nodes (index 0 = node 1). */
function build(adj: number[][]): GraphNode[] {
  const nodes = adj.map((_, i) => new GraphNode(i + 1));
  adj.forEach((nbs, i) => {
    nodes[i].neighbors = nbs.map((v) => nodes[v - 1]);
  });
  return nodes;
}

/** Collect every node reachable from start (BFS). */
function reachable(start: GraphNode): GraphNode[] {
  const seen = new Set<GraphNode>([start]);
  const queue = [start];
  for (let h = 0; h < queue.length; h++) {
    for (const nb of queue[h].neighbors) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return queue;
}

/** Back to adjacency-list form; also asserts one node object per value. */
function toAdj(start: GraphNode): number[][] {
  const nodes = reachable(start);
  const byVal = new Map<number, GraphNode>();
  for (const n of nodes) {
    if (byVal.has(n.val))
      throw new Error(`duplicate node object for value ${n.val}`);
    byVal.set(n.val, n);
  }
  const adj: number[][] = [];
  for (let v = 1; v <= nodes.length; v++) {
    const n = byVal.get(v);
    if (!n) throw new Error(`missing node ${v}`);
    adj.push(n.neighbors.map((nb) => nb.val));
  }
  return adj;
}

function check(adj: number[][]): GraphNode {
  const nodes = build(adj);
  const copy = cloneGraph(nodes[0]);
  expect(copy).not.toBeNull();
  const c = copy as GraphNode;
  expect(toAdj(c)).toEqual(adj);
  const originals = new Set(nodes);
  expect(reachable(c).filter((n) => originals.has(n))).toHaveLength(0);
  // originals untouched
  expect(toAdj(nodes[0])).toEqual(adj);
  return c;
}

describe('cloneGraph', () => {
  it('example: 4-cycle', () => {
    const c = check([
      [2, 4],
      [1, 3],
      [2, 4],
      [1, 3],
    ]);
    expect(c.neighbors[0].neighbors[0]).toBe(c);
  });

  it('single node with no neighbors', () => {
    const original = new GraphNode(1);
    const copy = cloneGraph(original) as GraphNode;
    expect(copy).not.toBe(original);
    expect(copy.val).toBe(1);
    expect(copy.neighbors).toEqual([]);
  });

  it('null -> null', () => {
    expect(cloneGraph(null)).toBeNull();
  });

  it('two nodes pointing at each other', () => {
    const c = check([[2], [1]]);
    expect(c.neighbors[0].neighbors[0]).toBe(c);
  });

  it('path graph', () => {
    check([[2], [1, 3], [2, 4], [3]]);
  });

  it('triangle: shared neighbors map to one clone each', () => {
    const c = check([
      [2, 3],
      [1, 3],
      [1, 2],
    ]);
    const [two, three] = c.neighbors;
    expect(two.neighbors[1]).toBe(three);
    expect(three.neighbors[1]).toBe(two);
  });

  it('star graph', () => {
    check([[2, 3, 4, 5], [1], [1], [1], [1]]);
  });

  it('complete graph K5', () => {
    const adj = [1, 2, 3, 4, 5].map((v) =>
      [1, 2, 3, 4, 5].filter((u) => u !== v),
    );
    check(adj);
  });

  it('preserves neighbor order', () => {
    check([
      [3, 2],
      [3, 1],
      [2, 1],
    ]);
  });

  it('large: long cycle of 20k nodes', () => {
    const n = 20_000;
    const adj = Array.from({ length: n }, (_, i) => [
      ((i + 1) % n) + 1,
      ((i - 1 + n) % n) + 1,
    ]);
    check(adj);
  });
});
