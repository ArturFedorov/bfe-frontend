import { findCycle, DependencyGraph } from './cycle_reporter';

/**
 * Verifies the returned path IS a real simple cycle in the graph:
 * - starts and ends with the same id, with at least one edge
 * - every consecutive pair is an actual dependency edge
 * - interior ids are all distinct
 */
function expectRealCycle(path: string[] | null, graph: DependencyGraph): void {
  expect(path).not.toBeNull();
  const cycle = path!;
  expect(cycle.length).toBeGreaterThanOrEqual(2);
  expect(cycle[0]).toBe(cycle[cycle.length - 1]);
  for (let i = 0; i < cycle.length - 1; i++) {
    const deps = graph[cycle[i]];
    expect(deps).toBeDefined();
    expect(deps).toContain(cycle[i + 1]);
  }
  const interior = cycle.slice(0, -1);
  expect(new Set(interior).size).toBe(interior.length);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Layered acyclic graph, 100 layers x 100 nodes, ~20k edges. */
function buildLayeredGraph(): DependencyGraph {
  const graph: DependencyGraph = {};
  for (let layer = 0; layer < 100; layer++) {
    for (let col = 0; col < 100; col++) {
      const id = `l${pad2(layer)}n${pad2(col)}`;
      if (layer === 0) {
        graph[id] = [];
      } else {
        const deps = [`l${pad2(layer - 1)}n${pad2(col)}`];
        if (col !== 0) {
          deps.push(`l${pad2(layer - 1)}n00`);
        }
        graph[id] = deps;
      }
    }
  }
  return graph;
}

describe('findCycle', () => {
  describe('acyclic graphs return null', () => {
    it('returns null for a linear chain', () => {
      expect(findCycle({ a: ['b'], b: ['c'], c: [] })).toBeNull();
    });

    it('returns null for a diamond (shared dependency is not a cycle)', () => {
      const graph: DependencyGraph = {
        d: ['b', 'c'],
        b: ['a'],
        c: ['a'],
        a: [],
      };
      expect(findCycle(graph)).toBeNull();
    });

    it('returns null for disconnected acyclic components', () => {
      expect(
        findCycle({ a: ['b'], b: [], x: ['y'], y: [], lone: [] }),
      ).toBeNull();
    });

    it('returns null for an empty graph', () => {
      expect(findCycle({})).toBeNull();
    });

    it('returns null for a single node with no dependencies', () => {
      expect(findCycle({ only: [] })).toBeNull();
    });
  });

  describe('cyclic graphs return a real cycle', () => {
    it('reports a self-dependency', () => {
      const graph: DependencyGraph = { a: ['a'], b: [] };
      expectRealCycle(findCycle(graph), graph);
    });

    it('reports a two-node cycle', () => {
      const graph: DependencyGraph = { a: ['b'], b: ['a'] };
      expectRealCycle(findCycle(graph), graph);
    });

    it('reports a longer cycle', () => {
      const graph: DependencyGraph = { a: ['b'], b: ['c'], c: ['d'], d: ['a'] };
      expectRealCycle(findCycle(graph), graph);
    });

    it('finds a cycle reachable only through an acyclic prefix', () => {
      const graph: DependencyGraph = {
        entry: ['mid'],
        mid: ['loop1'],
        loop1: ['loop2'],
        loop2: ['loop3'],
        loop3: ['loop1'],
      };
      const cycle = findCycle(graph);
      expectRealCycle(cycle, graph);
      // the acyclic lead-in must not be part of the reported cycle
      expect(cycle).not.toContain('entry');
      expect(cycle).not.toContain('mid');
    });

    it('finds a cycle hidden in a disconnected component', () => {
      const graph: DependencyGraph = {
        ok1: [],
        ok2: ['ok1'],
        x: ['y'],
        y: ['z'],
        z: ['x'],
      };
      expectRealCycle(findCycle(graph), graph);
    });

    it('returns some valid cycle when several exist', () => {
      const graph: DependencyGraph = {
        a: ['b'],
        b: ['a'],
        x: ['y'],
        y: ['z'],
        z: ['x'],
      };
      expectRealCycle(findCycle(graph), graph);
    });

    it('is deterministic for the same input', () => {
      const graph: DependencyGraph = { a: ['b'], b: ['c'], c: ['a'], d: ['a'] };
      expect(findCycle(graph)).toEqual(findCycle(graph));
    });
  });

  it('does not mutate the input graph', () => {
    const graph: DependencyGraph = { a: ['b'], b: ['a'], c: [] };
    const snapshot = JSON.parse(JSON.stringify(graph));
    findCycle(graph);
    expect(graph).toEqual(snapshot);
  });

  describe('large input', () => {
    it('returns null on a 10k-node acyclic layered graph', () => {
      expect(findCycle(buildLayeredGraph())).toBeNull();
    });

    it('finds the one cycle buried in a 10k-node graph', () => {
      const graph = buildLayeredGraph();
      // Back-edge: l50n77 additionally depends on l99n77, while l99n77 already
      // depends on l50n77 through the column chain (l99n77 -> l98n77 -> ... ->
      // l50n77) — this closes exactly one 50-edge cycle in the 10k-node graph.
      graph['l50n77'] = [...graph['l50n77'], 'l99n77'];
      expectRealCycle(findCycle(graph), graph);
    });
  });
});
