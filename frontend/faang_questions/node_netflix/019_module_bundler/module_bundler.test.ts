import { bundleOrder, Module } from './module_bundler';

const modules: Record<string, Module> = {
  entry: { id: 'entry', deps: ['a', 'b'] },
  a: { id: 'a', deps: ['c'] },
  b: { id: 'b', deps: ['c'] },
  c: { id: 'c', deps: [] },
};

// Assert the result is a valid topological order: every dependency that is
// itself present in the output appears before the module that imports it.
function assertTopological(
  order: string[],
  graph: Record<string, Module>,
): void {
  const position = new Map(order.map((id, i) => [id, i]));
  for (const id of order) {
    for (const dep of graph[id].deps) {
      if (position.has(dep)) {
        expect(position.get(dep)!).toBeLessThan(position.get(id)!);
      }
    }
  }
}

describe('bundleOrder', () => {
  it('orders dependencies before dependents', () => {
    const order = bundleOrder(modules, 'entry');
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('a'));
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('entry'));
    expect(order[order.length - 1]).toBe('entry');
  });

  it('throws on a cycle', () => {
    const cyclic: Record<string, Module> = {
      a: { id: 'a', deps: ['b'] },
      b: { id: 'b', deps: ['a'] },
    };
    expect(() => bundleOrder(cyclic, 'a')).toThrow();
  });
});

describe('bundleOrder — ordering invariants', () => {
  it('produces a valid topological order for a diamond graph', () => {
    const order = bundleOrder(modules, 'entry');
    assertTopological(order, modules);
    expect(order[order.length - 1]).toBe('entry');
  });

  it('includes each reachable module exactly once', () => {
    const order = bundleOrder(modules, 'entry');
    expect([...order].sort()).toEqual(['a', 'b', 'c', 'entry']);
    expect(new Set(order).size).toBe(order.length);
  });

  it('places a shared dependency before all of its dependents', () => {
    const order = bundleOrder(modules, 'entry');
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('a'));
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('b'));
  });

  it('orders a linear chain deepest-first', () => {
    const chain: Record<string, Module> = {
      a: { id: 'a', deps: ['b'] },
      b: { id: 'b', deps: ['c'] },
      c: { id: 'c', deps: ['d'] },
      d: { id: 'd', deps: [] },
    };
    expect(bundleOrder(chain, 'a')).toEqual(['d', 'c', 'b', 'a']);
  });

  it('returns just the entry when it has no dependencies', () => {
    const solo: Record<string, Module> = { entry: { id: 'entry', deps: [] } };
    expect(bundleOrder(solo, 'entry')).toEqual(['entry']);
  });
});

describe('bundleOrder — reachability', () => {
  it('excludes modules not reachable from the entry', () => {
    const withOrphan: Record<string, Module> = {
      entry: { id: 'entry', deps: ['a'] },
      a: { id: 'a', deps: [] },
      orphan: { id: 'orphan', deps: ['a'] },
    };
    const order = bundleOrder(withOrphan, 'entry');
    expect(order).not.toContain('orphan');
    expect([...order].sort()).toEqual(['a', 'entry']);
  });

  it('bundles only the subgraph rooted at the chosen entry', () => {
    const graph: Record<string, Module> = {
      app: { id: 'app', deps: ['shared'] },
      worker: { id: 'worker', deps: ['shared', 'wonly'] },
      shared: { id: 'shared', deps: [] },
      wonly: { id: 'wonly', deps: [] },
    };
    const order = bundleOrder(graph, 'app');
    expect([...order].sort()).toEqual(['app', 'shared']);
    expect(order).not.toContain('worker');
    expect(order).not.toContain('wonly');
  });
});

describe('bundleOrder — larger graph', () => {
  const big: Record<string, Module> = {
    entry: { id: 'entry', deps: ['ui', 'state'] },
    ui: { id: 'ui', deps: ['dom', 'state'] },
    state: { id: 'state', deps: ['util'] },
    dom: { id: 'dom', deps: ['util'] },
    util: { id: 'util', deps: [] },
  };

  it('respects every dependency edge', () => {
    const order = bundleOrder(big, 'entry');
    assertTopological(order, big);
  });

  it('puts the shared leaf first and the entry last', () => {
    const order = bundleOrder(big, 'entry');
    expect(order[0]).toBe('util');
    expect(order[order.length - 1]).toBe('entry');
  });

  it('lists each module once despite multiple import paths', () => {
    const order = bundleOrder(big, 'entry');
    expect(order).toHaveLength(5);
    expect(new Set(order).size).toBe(5);
  });
});

describe('bundleOrder — cycle detection', () => {
  it('throws on a self-referential module', () => {
    const selfCycle: Record<string, Module> = {
      a: { id: 'a', deps: ['a'] },
    };
    expect(() => bundleOrder(selfCycle, 'a')).toThrow();
  });

  it('throws on a transitive (three-node) cycle', () => {
    const cyclic: Record<string, Module> = {
      a: { id: 'a', deps: ['b'] },
      b: { id: 'b', deps: ['c'] },
      c: { id: 'c', deps: ['a'] },
    };
    expect(() => bundleOrder(cyclic, 'a')).toThrow();
  });

  it('throws when a cycle is nested deeper in the graph', () => {
    const cyclic: Record<string, Module> = {
      entry: { id: 'entry', deps: ['a'] },
      a: { id: 'a', deps: ['b'] },
      b: { id: 'b', deps: ['a'] },
    };
    expect(() => bundleOrder(cyclic, 'entry')).toThrow();
  });

  it('does not throw on a cycle that is unreachable from the entry', () => {
    const graph: Record<string, Module> = {
      entry: { id: 'entry', deps: ['a'] },
      a: { id: 'a', deps: [] },
      x: { id: 'x', deps: ['y'] },
      y: { id: 'y', deps: ['x'] },
    };
    expect(() => bundleOrder(graph, 'entry')).not.toThrow();
    expect([...bundleOrder(graph, 'entry')].sort()).toEqual(['a', 'entry']);
  });
});
