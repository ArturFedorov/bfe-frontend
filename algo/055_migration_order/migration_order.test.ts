import { migrationOrder, DependencyGraph } from './migration_order';

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

describe('migrationOrder', () => {
  it('orders a linear chain', () => {
    const graph: DependencyGraph = { a: ['b'], b: ['c'], c: [] };
    expect(migrationOrder(graph)).toEqual(['c', 'b', 'a']);
  });

  it('breaks ties alphabetically when several migrations are ready', () => {
    expect(migrationOrder({ b: [], a: [], c: [] })).toEqual(['a', 'b', 'c']);
  });

  it('is not a global alphabetical sort — readiness comes first', () => {
    const graph: DependencyGraph = { a: ['z'], b: [], z: [] };
    expect(migrationOrder(graph)).toEqual(['b', 'z', 'a']);
  });

  it('orders a diamond deterministically', () => {
    const graph: DependencyGraph = {
      d: ['b', 'c'],
      c: ['a'],
      b: ['a'],
      a: [],
    };
    expect(migrationOrder(graph)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('interleaves disconnected components alphabetically', () => {
    const graph: DependencyGraph = { b: ['a'], a: [], y: ['x'], x: [] };
    // ready: {a, x} -> a; ready: {b, x} -> b; ready: {x} -> x; then y
    expect(migrationOrder(graph)).toEqual(['a', 'b', 'x', 'y']);
  });

  it('unlocks a smaller id mid-run and picks it immediately', () => {
    const graph: DependencyGraph = { m: [], a: ['m'], z: [] };
    // ready: {m, z} -> m; 'a' unlocks and beats 'z'
    expect(migrationOrder(graph)).toEqual(['m', 'a', 'z']);
  });

  it('handles a single migration with no dependencies', () => {
    expect(migrationOrder({ only: [] })).toEqual(['only']);
  });

  it('returns an empty array for an empty graph', () => {
    expect(migrationOrder({})).toEqual([]);
  });

  it('ignores key insertion order entirely', () => {
    const first: DependencyGraph = { a: [], b: ['a'] };
    const second: DependencyGraph = { b: ['a'], a: [] };
    expect(migrationOrder(first)).toEqual(migrationOrder(second));
  });

  it('does not mutate the input graph', () => {
    const graph: DependencyGraph = { a: ['b'], b: ['c'], c: [] };
    const snapshot = JSON.parse(JSON.stringify(graph));
    migrationOrder(graph);
    expect(graph).toEqual(snapshot);
  });

  describe('cycles', () => {
    it('throws on a self-dependency', () => {
      expect(() => migrationOrder({ a: ['a'] })).toThrow();
    });

    it('throws on a two-node cycle', () => {
      expect(() => migrationOrder({ a: ['b'], b: ['a'] })).toThrow();
    });

    it('throws on a longer cycle', () => {
      expect(() =>
        migrationOrder({ a: ['b'], b: ['c'], c: ['d'], d: ['a'] }),
      ).toThrow();
    });

    it('throws when the cycle sits next to an acyclic component', () => {
      const graph: DependencyGraph = {
        ok1: [],
        ok2: ['ok1'],
        a: ['b'],
        b: ['c'],
        c: ['a'],
      };
      expect(() => migrationOrder(graph)).toThrow();
    });
  });

  describe('large input', () => {
    it('drains 10k nodes (100 chains of 100) chain by chain, alphabetically', () => {
      const graph = buildChains(100, 100);
      // c00n00 unlocks c00n01, which beats c01n00 — so chain 00 drains fully,
      // then chain 01, and so on.
      const expected: string[] = [];
      for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 100; j++) {
          expected.push(`c${pad2(i)}n${pad2(j)}`);
        }
      }
      expect(migrationOrder(graph)).toEqual(expected);
    });
  });
});
