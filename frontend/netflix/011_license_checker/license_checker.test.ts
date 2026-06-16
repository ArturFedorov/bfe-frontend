import { checkLicenses, PackageInfo } from './license_checker';

const deps: PackageInfo[] = [
  { name: 'a', license: 'MIT' },
  { name: 'b', license: 'GPL-3.0' },
  { name: 'c', license: 'Apache-2.0' },
  { name: 'd', license: 'AGPL-3.0' },
];

describe('checkLicenses', () => {
  it('flags copyleft licenses in a permissive project', () => {
    expect(checkLicenses('MIT', deps)).toEqual(['b', 'd']);
  });

  it('returns empty when all licenses are compatible', () => {
    expect(checkLicenses('MIT', [{ name: 'a', license: 'MIT' }])).toEqual([]);
  });
});
