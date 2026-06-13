import { findCycles, Graph } from './circular_dependency_detector';

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
});
