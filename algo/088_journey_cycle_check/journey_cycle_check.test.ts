import {
  Graph,
  topoOrder,
  findCycle,
  unreachable,
  validate,
} from './journey_cycle_check';

const linear: Graph = {
  nodes: ['welcome', 'wait', 'offer', 'thanks'],
  edges: [
    ['welcome', 'wait'],
    ['wait', 'offer'],
    ['offer', 'thanks'],
  ],
};

const diamond: Graph = {
  nodes: ['a', 'b', 'c', 'd'],
  edges: [
    ['a', 'b'],
    ['a', 'c'],
    ['b', 'd'],
    ['c', 'd'],
  ],
};

const looping: Graph = {
  nodes: ['a', 'b', 'c', 'd'],
  edges: [
    ['a', 'b'],
    ['b', 'c'],
    ['c', 'b'],
    ['d', 'ghost'],
  ],
};

/** Asserts `path` is a well-formed cycle in `g`: closes on itself and every hop is an edge. */
function expectValidCycle(g: Graph, path: string[] | null): asserts path is string[] {
  expect(path).not.toBeNull();
  const p = path as string[];
  expect(p.length).toBeGreaterThanOrEqual(2);
  expect(p[0]).toBe(p[p.length - 1]);
  const edgeSet = new Set(g.edges.map(([f, t]) => `${f}->${t}`));
  const everyHopIsAnEdge = p
    .slice(0, -1)
    .every((id, i) => edgeSet.has(`${id}->${p[i + 1]}`));
  expect(everyHopIsAnEdge).toBe(true);
}

function chain(n: number): Graph {
  const nodes = Array.from({ length: n }, (_, i) => `n${i}`);
  const edges: Array<[string, string]> = [];
  for (let i = 0; i + 1 < n; i++) edges.push([`n${i}`, `n${i + 1}`]);
  return { nodes, edges };
}

describe('topoOrder', () => {
  it('orders a linear journey', () => {
    expect(topoOrder(linear)).toEqual(['welcome', 'wait', 'offer', 'thanks']);
  });

  it('is deterministic on a diamond (ties by input order)', () => {
    expect(topoOrder(diamond)).toEqual(['a', 'b', 'c', 'd']);
    const reversed: Graph = {
      nodes: ['a', 'c', 'b', 'd'],
      edges: diamond.edges,
    };
    expect(topoOrder(reversed)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('prefers the earliest-index ready node over FIFO discovery order', () => {
    expect(
      topoOrder({ nodes: ['a', 'b', 'c', 'd'], edges: [['b', 'a']] }),
    ).toEqual(['b', 'a', 'c', 'd']);
  });

  it('returns null when a cycle exists', () => {
    expect(topoOrder(looping)).toBeNull();
    expect(topoOrder({ nodes: ['a'], edges: [['a', 'a']] })).toBeNull();
  });

  it('handles no edges, duplicate edges, and dangling edges', () => {
    expect(topoOrder({ nodes: ['x', 'y'], edges: [] })).toEqual(['x', 'y']);
    expect(
      topoOrder({
        nodes: ['x', 'y'],
        edges: [
          ['x', 'y'],
          ['x', 'y'],
        ],
      }),
    ).toEqual(['x', 'y']);
    expect(
      topoOrder({ nodes: ['x', 'y'], edges: [['y', 'x'], ['x', 'nope']] }),
    ).toEqual(['y', 'x']);
  });

  it('orders a 100k chain', () => {
    const g = chain(100_000);
    const order = topoOrder(g);
    expect(order).toHaveLength(100_000);
    expect(order![0]).toBe('n0');
    expect(order![99_999]).toBe('n99999');
  });
});

describe('findCycle', () => {
  it('returns null for acyclic graphs', () => {
    expect(findCycle(linear)).toBeNull();
    expect(findCycle(diamond)).toBeNull();
    expect(findCycle({ nodes: ['solo'], edges: [] })).toBeNull();
  });

  it('returns the cycle as a path closing on the back-edge target', () => {
    expect(findCycle(looping)).toEqual(['b', 'c', 'b']);
    expect(
      findCycle({
        nodes: ['a', 'b', 'c'],
        edges: [
          ['a', 'b'],
          ['b', 'c'],
          ['c', 'a'],
        ],
      }),
    ).toEqual(['a', 'b', 'c', 'a']);
  });

  it('reports a self-loop as [id, id]', () => {
    expect(findCycle({ nodes: ['a', 'b'], edges: [['a', 'b'], ['b', 'b']] })).toEqual([
      'b',
      'b',
    ]);
  });

  it('reports exactly one cycle when two disjoint cycles exist', () => {
    const g: Graph = {
      nodes: ['a', 'b', 'c', 'd'],
      edges: [
        ['a', 'b'],
        ['b', 'a'],
        ['c', 'd'],
        ['d', 'c'],
      ],
    };
    const cycle = findCycle(g);
    expectValidCycle(g, cycle);
    const members = new Set(cycle);
    const inFirst = members.has('a') || members.has('b');
    const inSecond = members.has('c') || members.has('d');
    expect(inFirst !== inSecond).toBe(true);
    // DFS from input order finds the a/b cycle first
    expect(cycle).toEqual(['a', 'b', 'a']);
  });

  it('ignores dangling edges and does not get fooled by a cross edge', () => {
    // a -> b, a -> c, c -> b: b is black when reached from c; not a cycle
    expect(
      findCycle({
        nodes: ['a', 'b', 'c'],
        edges: [
          ['a', 'b'],
          ['a', 'c'],
          ['c', 'b'],
          ['c', 'missing'],
        ],
      }),
    ).toBeNull();
  });

  it('survives a 100k chain with a back edge at the end', () => {
    const g = chain(100_000);
    g.edges.push(['n99999', 'n50000']);
    const cycle = findCycle(g);
    expectValidCycle(g, cycle);
    expect(cycle[0]).toBe('n50000');
    expect(cycle).toHaveLength(50_001);
  });
});

describe('unreachable', () => {
  it('returns [] when everything is reachable', () => {
    expect(unreachable(linear, 'welcome')).toEqual([]);
    expect(unreachable(diamond, 'a')).toEqual([]);
  });

  it('lists unreachable ids in input order', () => {
    expect(unreachable(linear, 'offer')).toEqual(['welcome', 'wait']);
    expect(unreachable(looping, 'a')).toEqual(['d']);
    expect(
      unreachable(
        { nodes: ['z', 'y', 'x', 'w'], edges: [['y', 'w']] },
        'y',
      ),
    ).toEqual(['z', 'x']);
  });

  it('follows edges in the forward direction only', () => {
    expect(unreachable({ nodes: ['a', 'b'], edges: [['b', 'a']] }, 'a')).toEqual(['b']);
  });

  it('throws RangeError for an unknown start', () => {
    expect(() => unreachable(linear, 'nope')).toThrow(RangeError);
  });
});

describe('validate', () => {
  it('reports a clean journey', () => {
    expect(validate(linear, 'welcome')).toEqual({
      cycle: null,
      unreachable: [],
      danglingEdges: [],
    });
  });

  it('reports cycle, unreachable nodes and dangling edges together', () => {
    expect(validate(looping, 'a')).toEqual({
      cycle: ['b', 'c', 'b'],
      unreachable: ['d'],
      danglingEdges: [['d', 'ghost']],
    });
  });

  it('lists dangling edges in input order including unknown sources', () => {
    const g: Graph = {
      nodes: ['a', 'b'],
      edges: [
        ['a', 'b'],
        ['phantom', 'a'],
        ['b', 'void'],
      ],
    };
    expect(validate(g, 'a').danglingEdges).toEqual([
      ['phantom', 'a'],
      ['b', 'void'],
    ]);
  });

  it('does not mutate the input graph', () => {
    const g: Graph = {
      nodes: ['a', 'b'],
      edges: [
        ['a', 'b'],
        ['b', 'x'],
      ],
    };
    const snapshot = JSON.stringify(g);
    validate(g, 'a');
    topoOrder(g);
    findCycle(g);
    unreachable(g, 'a');
    expect(JSON.stringify(g)).toBe(snapshot);
  });

  it('throws RangeError for an unknown start', () => {
    expect(() => validate(linear, 'nope')).toThrow(RangeError);
  });
});
