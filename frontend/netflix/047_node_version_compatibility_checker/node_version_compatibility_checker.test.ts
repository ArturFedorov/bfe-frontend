import {
  checkEngines,
  PackageEngines,
} from './node_version_compatibility_checker';

const packages: PackageEngines[] = [
  { name: 'a', engines: { node: '>=18.0.0' } },
  { name: 'b', engines: { node: '>=20.0.0' } },
  { name: 'c' }, // no constraint -> ok
];

describe('checkEngines', () => {
  it('flags packages incompatible with the target node', () => {
    expect(checkEngines(packages, '18.17.0')).toEqual(['b']);
  });

  it('returns empty when everything is compatible', () => {
    expect(checkEngines(packages, '20.1.0')).toEqual([]);
  });

  it('returns empty for an empty package list', () => {
    expect(checkEngines([], '18.17.0')).toEqual([]);
  });

  it('treats a package with no engines field as compatible', () => {
    expect(checkEngines([{ name: 'p' }], '0.0.1')).toEqual([]);
  });

  it('treats a package with an empty engines object as compatible', () => {
    expect(checkEngines([{ name: 'p', engines: {} }], '0.0.1')).toEqual([]);
  });

  it('flags every package when the target satisfies none of them', () => {
    expect(checkEngines(packages, '16.0.0')).toEqual(['a', 'b']);
  });

  it('preserves input order in the returned list of incompatible names', () => {
    const reordered: PackageEngines[] = [
      { name: 'z', engines: { node: '>=20.0.0' } },
      { name: 'y', engines: { node: '>=20.0.0' } },
      { name: 'x', engines: { node: '>=18.0.0' } },
    ];
    expect(checkEngines(reordered, '16.0.0')).toEqual(['z', 'y', 'x']);
  });

  it('respects an inclusive lower bound (>=) exactly at the boundary', () => {
    const pkgs: PackageEngines[] = [
      { name: 'p', engines: { node: '>=18.0.0' } },
    ];
    expect(checkEngines(pkgs, '18.0.0')).toEqual([]);
    expect(checkEngines(pkgs, '17.99.99')).toEqual(['p']);
  });

  it('supports caret ranges for the engines field', () => {
    const pkgs: PackageEngines[] = [
      { name: 'p', engines: { node: '^18.0.0' } },
    ];
    expect(checkEngines(pkgs, '18.5.0')).toEqual([]);
    expect(checkEngines(pkgs, '19.0.0')).toEqual(['p']);
  });

  it('supports an exact-pin engines range', () => {
    const pkgs: PackageEngines[] = [
      { name: 'p', engines: { node: '18.17.0' } },
    ];
    expect(checkEngines(pkgs, '18.17.0')).toEqual([]);
    expect(checkEngines(pkgs, '18.17.1')).toEqual(['p']);
  });

  it('supports a bounded range combining >= and <', () => {
    const pkgs: PackageEngines[] = [
      { name: 'p', engines: { node: '>=16.0.0 <19.0.0' } },
    ];
    expect(checkEngines(pkgs, '18.0.0')).toEqual([]);
    expect(checkEngines(pkgs, '19.0.0')).toEqual(['p']);
    expect(checkEngines(pkgs, '15.0.0')).toEqual(['p']);
  });

  it('supports || unions in the engines range', () => {
    const pkgs: PackageEngines[] = [
      { name: 'p', engines: { node: '^16.0.0 || ^18.0.0' } },
    ];
    expect(checkEngines(pkgs, '17.0.0')).toEqual(['p']);
    expect(checkEngines(pkgs, '18.2.0')).toEqual([]);
  });

  it('does not mutate the input packages array', () => {
    const snapshot = JSON.parse(JSON.stringify(packages));
    checkEngines(packages, '18.17.0');
    expect(packages).toEqual(snapshot);
  });
});
