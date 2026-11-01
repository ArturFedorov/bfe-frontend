import { findCycles, Graph } from './circular_dependency_detector';

// The exact representation of a cycle is implementation-defined: the starting
// node (rotation), the direction of traversal, and whether the path is returned
// "closed" (e.g. ['a','b','a']) can all vary. These helpers compare *which*
// nodes form a cycle, independent of those choices.
function cycleKey(cycle: string[]): string {
  return Array.from(new Set(cycle)).sort().join(',');
}

function cycleKeySet(cycles: string[][]): Set<string> {
  return new Set(cycles.map(cycleKey));
}

function nodesInCycles(cycles: string[][]): Set<string> {
  return new Set(cycles.flat());
}

describe('findCycles', () => {
  it('returns no cycles for an acyclic graph', () => {
    const g: Graph = { a: ['b'], b: ['c'], c: [] };
    expect(findCycles(g)).toEqual([]);
  });

  it('detects a simple cycle', () => {
    const g: Graph = { a: ['b'], b: ['c'], c: ['a'] };
    const cycles = findCycles(g);
    expect(cycles.length).toBeGreaterThanOrEqual(1);
    expect(new Set(cycles[0])).toEqual(new Set(['a', 'b', 'c']));
  });

  it('detects a self loop', () => {
    const g: Graph = { a: ['a'] };
    expect(findCycles(g).length).toBeGreaterThanOrEqual(1);
  });

  describe('acyclic graphs report nothing', () => {
    it('returns [] for an empty graph', () => {
      expect(findCycles({})).toEqual([]);
    });

    it('returns [] for a single node with no edges', () => {
      expect(findCycles({ a: [] })).toEqual([]);
    });

    it('returns [] for a diamond DAG', () => {
      const g: Graph = { a: ['b', 'c'], b: ['d'], c: ['d'], d: [] };
      expect(findCycles(g)).toEqual([]);
    });

    it('returns [] for disconnected acyclic components', () => {
      const g: Graph = { a: ['b'], b: [], x: ['y'], y: [] };
      expect(findCycles(g)).toEqual([]);
    });
  });

  describe('single cycles', () => {
    it('detects a 2-node cycle (a <-> b)', () => {
      const g: Graph = { a: ['b'], b: ['a'] };
      expect(cycleKeySet(findCycles(g))).toEqual(new Set(['a,b']));
    });

    it('detects a longer 5-node cycle', () => {
      const g: Graph = {
        a: ['b'],
        b: ['c'],
        c: ['d'],
        d: ['e'],
        e: ['a'],
      };
      expect(cycleKeySet(findCycles(g))).toEqual(new Set(['a,b,c,d,e']));
    });
  });

  describe('nodes outside the cycle are excluded', () => {
    it('ignores an acyclic tail that leads into a cycle', () => {
      // start -> a, and a -> b -> c -> a forms the cycle; start is not part of it
      const g: Graph = { start: ['a'], a: ['b'], b: ['c'], c: ['a'] };
      const cycles = findCycles(g);
      expect(cycleKeySet(cycles)).toEqual(new Set(['a,b,c']));
      expect(nodesInCycles(cycles).has('start')).toBe(false);
    });

    it('ignores a leaf pointed to from inside a cycle', () => {
      const g: Graph = { a: ['b'], b: ['a', 'leaf'], leaf: [] };
      const cycles = findCycles(g);
      expect(cycleKeySet(cycles)).toEqual(new Set(['a,b']));
      expect(nodesInCycles(cycles).has('leaf')).toBe(false);
    });
  });

  describe('multiple cycles', () => {
    it('detects two disjoint cycles', () => {
      const g: Graph = { a: ['b'], b: ['a'], c: ['d'], d: ['c'] };
      expect(cycleKeySet(findCycles(g))).toEqual(new Set(['a,b', 'c,d']));
    });

    it('detects overlapping cycles sharing a node (figure-eight)', () => {
      // a <-> b and b <-> c share node b
      const g: Graph = { a: ['b'], b: ['a', 'c'], c: ['b'] };
      const cycles = findCycles(g);
      expect(cycles.length).toBeGreaterThanOrEqual(1);
      // Regardless of how the cycles are decomposed, all three nodes participate.
      expect(nodesInCycles(cycles)).toEqual(new Set(['a', 'b', 'c']));
    });

    it('detects a self loop alongside a separate cycle', () => {
      const g: Graph = { a: ['a'], b: ['c'], c: ['b'] };
      expect(cycleKeySet(findCycles(g))).toEqual(new Set(['a', 'b,c']));
    });
  });
});
