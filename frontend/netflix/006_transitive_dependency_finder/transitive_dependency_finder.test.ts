import { findTransitive, Graph } from './transitive_dependency_finder';

const graph: Graph = {
  a: ['b', 'c'],
  b: ['d'],
  c: ['d', 'e'],
  d: [],
  e: [],
};

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
});
