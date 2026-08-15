import { hasDependency, DependencyGraph } from './has_dependency';

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

describe('hasDependency', () => {
  it('detects a direct dependency', () => {
    const graph: DependencyGraph = { a: ['b'], b: [] };
    expect(hasDependency(graph, 'a', 'b')).toBe(true);
  });

  it('detects a transitive dependency through a linear chain', () => {
    const graph: DependencyGraph = { a: ['b'], b: ['c'], c: ['d'], d: [] };
    expect(hasDependency(graph, 'a', 'd')).toBe(true);
    expect(hasDependency(graph, 'b', 'd')).toBe(true);
  });

  it('respects edge direction', () => {
    const graph: DependencyGraph = { a: ['b'], b: ['c'], c: [] };
    expect(hasDependency(graph, 'c', 'a')).toBe(false);
    expect(hasDependency(graph, 'b', 'a')).toBe(false);
  });

  it('handles diamond dependencies', () => {
    const graph: DependencyGraph = {
      app: ['ui', 'api'],
      ui: ['utils'],
      api: ['utils'],
      utils: [],
    };
    expect(hasDependency(graph, 'app', 'utils')).toBe(true);
    expect(hasDependency(graph, 'ui', 'api')).toBe(false);
    expect(hasDependency(graph, 'api', 'ui')).toBe(false);
  });

  it('returns false across disconnected components', () => {
    const graph: DependencyGraph = { a: ['b'], b: [], x: ['y'], y: [] };
    expect(hasDependency(graph, 'a', 'x')).toBe(false);
    expect(hasDependency(graph, 'x', 'b')).toBe(false);
    expect(hasDependency(graph, 'a', 'b')).toBe(true);
    expect(hasDependency(graph, 'x', 'y')).toBe(true);
  });

  describe('self dependency', () => {
    it('returns true for a node with a self-loop', () => {
      const graph: DependencyGraph = { a: ['a'], b: [] };
      expect(hasDependency(graph, 'a', 'a')).toBe(true);
    });

    it('returns false for a node without a path back to itself', () => {
      const graph: DependencyGraph = { a: ['b'], b: [] };
      expect(hasDependency(graph, 'a', 'a')).toBe(false);
      expect(hasDependency(graph, 'b', 'b')).toBe(false);
    });
  });

  describe('cycles', () => {
    it('terminates on a two-node cycle and answers correctly', () => {
      const graph: DependencyGraph = { a: ['b'], b: ['a'], c: [] };
      expect(hasDependency(graph, 'a', 'b')).toBe(true);
      expect(hasDependency(graph, 'b', 'a')).toBe(true);
      expect(hasDependency(graph, 'a', 'a')).toBe(true);
      expect(hasDependency(graph, 'a', 'c')).toBe(false);
    });

    it('terminates on a longer cycle and answers correctly', () => {
      const graph: DependencyGraph = { a: ['b'], b: ['c'], c: ['a'], d: ['a'], e: [] };
      expect(hasDependency(graph, 'a', 'c')).toBe(true);
      expect(hasDependency(graph, 'c', 'b')).toBe(true);
      expect(hasDependency(graph, 'd', 'c')).toBe(true);
      expect(hasDependency(graph, 'a', 'd')).toBe(false);
      expect(hasDependency(graph, 'b', 'b')).toBe(true);
      expect(hasDependency(graph, 'a', 'e')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles an empty graph', () => {
      expect(hasDependency({}, 'a', 'b')).toBe(false);
    });

    it('returns false from a node with no dependencies', () => {
      const graph: DependencyGraph = { a: [], b: ['a'] };
      expect(hasDependency(graph, 'a', 'b')).toBe(false);
    });

    it('returns false for unknown package ids', () => {
      const graph: DependencyGraph = { a: ['b'], b: [] };
      expect(hasDependency(graph, 'ghost', 'a')).toBe(false);
      expect(hasDependency(graph, 'a', 'ghost')).toBe(false);
    });

    it('does not mutate the input graph', () => {
      const graph: DependencyGraph = { a: ['b'], b: ['c'], c: [] };
      const snapshot = JSON.parse(JSON.stringify(graph));
      hasDependency(graph, 'a', 'c');
      expect(graph).toEqual(snapshot);
    });
  });

  describe('large input', () => {
    it('handles 10k nodes in 100 chains of 100', () => {
      const graph = buildChains(100, 100);
      expect(hasDependency(graph, 'c05n99', 'c05n00')).toBe(true);
      expect(hasDependency(graph, 'c05n00', 'c05n99')).toBe(false);
      expect(hasDependency(graph, 'c05n99', 'c06n00')).toBe(false);
      expect(hasDependency(graph, 'c99n99', 'c99n00')).toBe(true);
    });
  });
});
