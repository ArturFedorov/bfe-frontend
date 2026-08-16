import { buildOrder, DependencyGraph } from './build_order_dfs';

function expectValidOrder(order: string[], graph: DependencyGraph): void {
  const nodes = Object.keys(graph);
  expect(order).toHaveLength(nodes.length);
  expect(new Set(order).size).toBe(order.length);
  const pos = new Map<string, number>();
  order.forEach((node, i) => pos.set(node, i));
  for (const node of nodes) {
    expect(pos.has(node)).toBe(true);
    for (const dep of graph[node]) {
      expect(pos.get(dep)!).toBeLessThan(pos.get(node)!);
    }
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function buildChains(chains: number, length: number): DependencyGraph {
  const graph: DependencyGraph = {};
  for (let i = 0; i < chains; i++) {
    for (let j = 0; j < length; j++) {
      const id = `c${pad2(i)}n${pad2(j)}`;
      graph[id] = j === 0 ? [] : [`c${pad2(i)}n${pad2(j - 1)}`];
    }
  }
  return graph;
}

describe('buildOrder (DFS three-color)', () => {
  it('orders a linear chain', () => {
    const graph: DependencyGraph = { a: ['b'], b: ['c'], c: [] };
    expectValidOrder(buildOrder(graph), graph);
  });

  it('orders a diamond', () => {
    const graph: DependencyGraph = {
      app: ['lib', 'assets'],
      lib: ['utils'],
      assets: ['utils'],
      utils: [],
    };
    expectValidOrder(buildOrder(graph), graph);
  });

  it('does not treat a re-reached black node as a cycle (shared dependency)', () => {
    // Both lib and assets depend on utils: utils is finished (black) when
    // reached the second time — this must NOT throw.
    const graph: DependencyGraph = {
      app: ['lib', 'assets'],
      lib: ['utils'],
      assets: ['utils'],
      utils: [],
    };
    expect(() => buildOrder(graph)).not.toThrow();
  });

  it('orders disconnected components', () => {
    const graph: DependencyGraph = {
      a: ['b'],
      b: [],
      x: ['y'],
      y: [],
      lone: [],
    };
    expectValidOrder(buildOrder(graph), graph);
  });

  it('handles a single node with no dependencies', () => {
    const graph: DependencyGraph = { only: [] };
    expect(buildOrder(graph)).toEqual(['only']);
  });

  it('returns an empty array for an empty graph', () => {
    expect(buildOrder({})).toEqual([]);
  });

  it('is deterministic for the same input', () => {
    const graph: DependencyGraph = {
      app: ['lib', 'assets'],
      lib: ['utils'],
      assets: ['utils'],
      utils: [],
    };
    expect(buildOrder(graph)).toEqual(buildOrder(graph));
  });

  it('does not mutate the input graph', () => {
    const graph: DependencyGraph = { a: ['b'], b: ['c'], c: [] };
    const snapshot = JSON.parse(JSON.stringify(graph));
    buildOrder(graph);
    expect(graph).toEqual(snapshot);
  });

  describe('cycles', () => {
    it('throws on a self-dependency', () => {
      expect(() => buildOrder({ a: ['a'] })).toThrow();
    });

    it('throws on a two-node cycle', () => {
      expect(() => buildOrder({ a: ['b'], b: ['a'] })).toThrow();
    });

    it('throws on a longer cycle', () => {
      expect(() =>
        buildOrder({ a: ['b'], b: ['c'], c: ['d'], d: ['a'] }),
      ).toThrow();
    });

    it('throws when the cycle is only reachable deep in the graph', () => {
      const graph: DependencyGraph = {
        entry: ['mid'],
        mid: ['loop1'],
        loop1: ['loop2'],
        loop2: ['loop1'],
      };
      expect(() => buildOrder(graph)).toThrow();
    });

    it('throws when the cycle sits next to an acyclic component', () => {
      const graph: DependencyGraph = {
        ok1: [],
        ok2: ['ok1'],
        a: ['b'],
        b: ['c'],
        c: ['a'],
      };
      expect(() => buildOrder(graph)).toThrow();
    });
  });

  describe('large input', () => {
    it('orders 10k nodes in 100 chains of 100', () => {
      const graph = buildChains(100, 100);
      expectValidOrder(buildOrder(graph), graph);
    });
  });
});
