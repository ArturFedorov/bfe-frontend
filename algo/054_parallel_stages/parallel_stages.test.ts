import { parallelStages, DependencyGraph } from './parallel_stages';

function expectValidStages(stages: string[][], graph: DependencyGraph): void {
  const nodes = Object.keys(graph);
  const flat = stages.flat();
  expect(flat).toHaveLength(nodes.length);
  expect(new Set(flat).size).toBe(flat.length);
  const stageOf = new Map<string, number>();
  stages.forEach((stage, i) => {
    for (const node of stage) {
      stageOf.set(node, i);
    }
  });
  for (const node of nodes) {
    expect(stageOf.has(node)).toBe(true);
    const deps = graph[node];
    for (const dep of deps) {
      expect(stageOf.get(dep)!).toBeLessThan(stageOf.get(node)!);
    }
    // stage must be exactly 1 + max dependency stage (earliest possible)
    const expected = deps.length === 0 ? 0 : 1 + Math.max(...deps.map((d) => stageOf.get(d)!));
    expect(stageOf.get(node)).toBe(expected);
  }
  for (const stage of stages) {
    expect(stage).toEqual([...stage].sort());
    expect(stage.length).toBeGreaterThan(0);
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

describe('parallelStages', () => {
  it('turns a linear chain into single-target stages', () => {
    const graph: DependencyGraph = { a: ['b'], b: ['c'], c: [] };
    expect(parallelStages(graph)).toEqual([['c'], ['b'], ['a']]);
  });

  it('stages a diamond with the middle layer in parallel', () => {
    const graph: DependencyGraph = {
      app: ['lib', 'assets'],
      lib: ['utils'],
      assets: ['utils'],
      utils: [],
    };
    expect(parallelStages(graph)).toEqual([['utils'], ['assets', 'lib'], ['app']]);
  });

  it('sorts each stage alphabetically', () => {
    const graph: DependencyGraph = { zeta: [], alpha: [], mid: ['zeta', 'alpha'] };
    expect(parallelStages(graph)).toEqual([['alpha', 'zeta'], ['mid']]);
  });

  it('merges disconnected components into shared stages', () => {
    const graph: DependencyGraph = { a: ['b'], b: [], x: ['y'], y: [], lone: [] };
    expect(parallelStages(graph)).toEqual([
      ['b', 'lone', 'y'],
      ['a', 'x'],
    ]);
  });

  it('puts a target in the earliest stage after its slowest dependency', () => {
    // 'late' depends on both a stage-0 and a stage-2 target -> stage 3
    const graph: DependencyGraph = {
      base: [],
      mid: ['base'],
      top: ['mid'],
      late: ['base', 'top'],
    };
    expect(parallelStages(graph)).toEqual([['base'], ['mid'], ['top'], ['late']]);
  });

  it('handles a single node with no dependencies', () => {
    expect(parallelStages({ only: [] })).toEqual([['only']]);
  });

  it('returns an empty array for an empty graph', () => {
    expect(parallelStages({})).toEqual([]);
  });

  it('does not mutate the input graph', () => {
    const graph: DependencyGraph = { a: ['b'], b: ['c'], c: [] };
    const snapshot = JSON.parse(JSON.stringify(graph));
    parallelStages(graph);
    expect(graph).toEqual(snapshot);
  });

  describe('cycles', () => {
    it('throws on a self-dependency', () => {
      expect(() => parallelStages({ a: ['a'] })).toThrow();
    });

    it('throws on a two-node cycle', () => {
      expect(() => parallelStages({ a: ['b'], b: ['a'] })).toThrow();
    });

    it('throws on a longer cycle', () => {
      expect(() => parallelStages({ a: ['b'], b: ['c'], c: ['d'], d: ['a'] })).toThrow();
    });

    it('throws when the cycle sits next to an acyclic component', () => {
      const graph: DependencyGraph = { ok1: [], ok2: ['ok1'], a: ['b'], b: ['c'], c: ['a'] };
      expect(() => parallelStages(graph)).toThrow();
    });
  });

  describe('large input', () => {
    it('stages 10k nodes in 100 chains of 100 into 100 stages of 100', () => {
      const graph = buildChains(100, 100);
      const stages = parallelStages(graph);
      expect(stages).toHaveLength(100);
      for (const stage of stages) {
        expect(stage).toHaveLength(100);
      }
      expectValidStages(stages, graph);
    });
  });
});
