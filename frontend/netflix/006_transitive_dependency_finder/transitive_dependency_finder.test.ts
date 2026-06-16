import { findTransitive, Graph } from './transitive_dependency_finder';

const graph: Graph = {
  a: ['b', 'c'],
  b: ['d'],
  c: ['d', 'e'],
  d: [],
  e: [],
};

// Result order is implementation-defined; compare membership only.
function reachable(g: Graph, start: string): string[] {
  return [...findTransitive(g, start)].sort();
}

describe('findTransitive', () => {
  it('finds direct and transitive deps', () => {
    expect(new Set(findTransitive(graph, 'a'))).toEqual(
      new Set(['b', 'c', 'd', 'e']),
    );
  });

  it('excludes the start node', () => {
    expect(findTransitive(graph, 'a')).not.toContain('a');
  });

  it('returns empty for a leaf', () => {
    expect(findTransitive(graph, 'd')).toEqual([]);
  });

  describe('diamonds and shared subgraphs', () => {
    it('does not duplicate a node reachable via multiple paths', () => {
      // d is reachable through both b and c.
      const result = findTransitive(graph, 'a');
      expect(result.filter((n) => n === 'd')).toHaveLength(1);
      expect(new Set(result).size).toBe(result.length);
    });

    it('returns each node exactly once in a wide diamond', () => {
      const g: Graph = {
        root: ['l1', 'l2', 'l3'],
        l1: ['shared'],
        l2: ['shared'],
        l3: ['shared'],
        shared: ['leaf'],
        leaf: [],
      };
      const result = findTransitive(g, 'root');
      expect(reachable(g, 'root')).toEqual(
        ['l1', 'l2', 'l3', 'leaf', 'shared'].sort(),
      );
      expect(new Set(result).size).toBe(result.length);
    });
  });

  describe('cycle guarding', () => {
    it('terminates and excludes start on a direct cycle a -> b -> a', () => {
      const g: Graph = { a: ['b'], b: ['a'] };
      expect(reachable(g, 'a')).toEqual(['b']);
      expect(findTransitive(g, 'a')).not.toContain('a');
    });

    it('handles a self-loop without infinite recursion', () => {
      const g: Graph = { a: ['a', 'b'], b: [] };
      expect(reachable(g, 'a')).toEqual(['b']);
      expect(findTransitive(g, 'a')).not.toContain('a');
    });

    it('handles a 3-node cycle and still finds nodes hanging off it', () => {
      const g: Graph = {
        a: ['b'],
        b: ['c'],
        c: ['a', 'd'],
        d: [],
      };
      expect(reachable(g, 'a')).toEqual(['b', 'c', 'd']);
      expect(findTransitive(g, 'a')).not.toContain('a');
    });

    it('finds the start node only when it is genuinely a dependency of another node', () => {
      // b depends back on a; starting from b, a IS a transitive dep of b.
      const g: Graph = { a: ['b'], b: ['a'] };
      expect(reachable(g, 'b')).toEqual(['a']);
    });

    it('handles nested/overlapping cycles', () => {
      const g: Graph = {
        a: ['b', 'c'],
        b: ['c'],
        c: ['a', 'b'],
      };
      expect(reachable(g, 'a')).toEqual(['b', 'c']);
    });
  });

  describe('depth and breadth', () => {
    it('follows a long linear chain to the end', () => {
      const g: Graph = {};
      const n = 200;
      for (let i = 0; i < n; i++) {
        g[`p${i}`] = i < n - 1 ? [`p${i + 1}`] : [];
      }
      const result = reachable(g, 'p0');
      const expected = Array.from(
        { length: n - 1 },
        (_, i) => `p${i + 1}`,
      ).sort();
      expect(result).toEqual(expected);
      expect(result).not.toContain('p0');
    });

    it('does not leak into disconnected components', () => {
      const g: Graph = {
        a: ['b'],
        b: [],
        x: ['y'],
        y: ['a'], // x's component reaches a, but a's does not reach x.
      };
      expect(reachable(g, 'a')).toEqual(['b']);
      expect(reachable(g, 'x')).toEqual(['a', 'b', 'y']);
    });
  });

  describe('edge cases', () => {
    it('treats duplicate edges as a single dependency', () => {
      const g: Graph = { a: ['b', 'b', 'b'], b: [] };
      expect(reachable(g, 'a')).toEqual(['b']);
    });

    it('returns empty when the start has no dependencies', () => {
      const g: Graph = { lonely: [] };
      expect(findTransitive(g, 'lonely')).toEqual([]);
    });

    it('treats a referenced-but-undefined node as having no dependencies', () => {
      // `b` is listed as a dep but has no own entry in the graph.
      const g: Graph = { a: ['b'] };
      expect(reachable(g, 'a')).toEqual(['b']);
    });
  });
});
