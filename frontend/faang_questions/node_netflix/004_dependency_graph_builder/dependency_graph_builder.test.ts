import { buildGraph, PackageManifest } from './dependency_graph_builder';

const manifests: PackageManifest[] = [
  { name: 'a', version: '1.0.0', dependencies: { b: '^1.0.0', c: '^1.0.0' } },
  { name: 'b', version: '1.0.0', dependencies: { c: '^1.0.0' } },
  { name: 'c', version: '1.0.0' },
];

describe('buildGraph', () => {
  it('maps each package to its dependency names', () => {
    const g = buildGraph(manifests);
    expect(new Set(g.a)).toEqual(new Set(['b', 'c']));
    expect(g.b).toEqual(['c']);
  });

  it('includes leaf packages with empty deps', () => {
    const g = buildGraph(manifests);
    expect(g.c).toEqual([]);
  });

  describe('referenced-but-undeclared packages', () => {
    it('adds a key for a dependency that has no manifest of its own', () => {
      const g = buildGraph([
        { name: 'a', version: '1.0.0', dependencies: { b: '^1.0.0' } },
      ]);
      // `b` is referenced but never declared as a manifest
      expect(g).toHaveProperty('b');
      expect(g.b).toEqual([]);
    });

    it('still records the edge to the undeclared dependency', () => {
      const g = buildGraph([
        { name: 'a', version: '1.0.0', dependencies: { ghost: '^2.0.0' } },
      ]);
      expect(g.a).toEqual(['ghost']);
      expect(g.ghost).toEqual([]);
    });
  });

  describe('empty and trivial inputs', () => {
    it('returns an empty object for no manifests', () => {
      expect(buildGraph([])).toEqual({});
    });

    it('treats an empty dependencies object like a leaf', () => {
      const g = buildGraph([
        { name: 'solo', version: '1.0.0', dependencies: {} },
      ]);
      expect(g).toEqual({ solo: [] });
    });
  });

  describe('graph shapes', () => {
    it('handles a diamond (a -> b, a -> c, b -> d, c -> d)', () => {
      const g = buildGraph([
        { name: 'a', version: '1.0.0', dependencies: { b: '*', c: '*' } },
        { name: 'b', version: '1.0.0', dependencies: { d: '*' } },
        { name: 'c', version: '1.0.0', dependencies: { d: '*' } },
        { name: 'd', version: '1.0.0' },
      ]);
      expect(new Set(g.a)).toEqual(new Set(['b', 'c']));
      expect(g.b).toEqual(['d']);
      expect(g.c).toEqual(['d']);
      expect(g.d).toEqual([]);
    });

    it('handles a direct cycle (a -> b -> a) without looping forever', () => {
      const g = buildGraph([
        { name: 'a', version: '1.0.0', dependencies: { b: '*' } },
        { name: 'b', version: '1.0.0', dependencies: { a: '*' } },
      ]);
      expect(g.a).toEqual(['b']);
      expect(g.b).toEqual(['a']);
    });

    it('handles a self-dependency', () => {
      const g = buildGraph([
        { name: 'a', version: '1.0.0', dependencies: { a: '*' } },
      ]);
      expect(g.a).toEqual(['a']);
    });
  });

  describe('multiple dependents', () => {
    it('lists a shared dependency under each dependent independently', () => {
      const g = buildGraph([
        { name: 'a', version: '1.0.0', dependencies: { shared: '*' } },
        { name: 'b', version: '1.0.0', dependencies: { shared: '*' } },
        { name: 'shared', version: '1.0.0' },
      ]);
      expect(g.a).toEqual(['shared']);
      expect(g.b).toEqual(['shared']);
      expect(g.shared).toEqual([]);
    });

    it('includes every package as a key', () => {
      const g = buildGraph([
        { name: 'a', version: '1.0.0', dependencies: { b: '*', c: '*' } },
        { name: 'b', version: '1.0.0', dependencies: { c: '*' } },
        { name: 'c', version: '1.0.0' },
      ]);
      expect(new Set(Object.keys(g))).toEqual(new Set(['a', 'b', 'c']));
    });
  });
});
