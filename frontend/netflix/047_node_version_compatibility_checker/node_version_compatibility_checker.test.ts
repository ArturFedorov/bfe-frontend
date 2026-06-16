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
});
