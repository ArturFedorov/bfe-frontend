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
});
