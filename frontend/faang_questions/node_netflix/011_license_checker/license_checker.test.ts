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

describe('checkLicenses — copyleft family coverage', () => {
  it('flags the full GPL / AGPL / LGPL family', () => {
    const copyleft: PackageInfo[] = [
      { name: 'gpl2', license: 'GPL-2.0' },
      { name: 'gpl3', license: 'GPL-3.0' },
      { name: 'lgpl', license: 'LGPL-2.1' },
      { name: 'agpl', license: 'AGPL-3.0' },
    ];
    expect(checkLicenses('MIT', copyleft)).toEqual([
      'gpl2',
      'gpl3',
      'lgpl',
      'agpl',
    ]);
  });

  it('flags copyleft suffixed variants (-only / -or-later)', () => {
    const variants: PackageInfo[] = [
      { name: 'a', license: 'GPL-3.0-only' },
      { name: 'b', license: 'GPL-3.0-or-later' },
      { name: 'c', license: 'LGPL-3.0-or-later' },
    ];
    expect(checkLicenses('MIT', variants)).toEqual(['a', 'b', 'c']);
  });

  it('does not flag permissive licenses', () => {
    const permissive: PackageInfo[] = [
      { name: 'a', license: 'MIT' },
      { name: 'b', license: 'Apache-2.0' },
      { name: 'c', license: 'BSD-3-Clause' },
      { name: 'd', license: 'ISC' },
    ];
    expect(checkLicenses('MIT', permissive)).toEqual([]);
  });
});

describe('checkLicenses — permissive project variants', () => {
  it('treats an Apache-2.0 project as permissive too', () => {
    expect(checkLicenses('Apache-2.0', deps)).toEqual(['b', 'd']);
  });
});

describe('checkLicenses — ordering and structure', () => {
  it('preserves dependency input order in the result', () => {
    const mixed: PackageInfo[] = [
      { name: 'z', license: 'AGPL-3.0' },
      { name: 'm', license: 'MIT' },
      { name: 'a', license: 'GPL-2.0' },
    ];
    expect(checkLicenses('MIT', mixed)).toEqual(['z', 'a']);
  });

  it('returns package names, not license strings or objects', () => {
    const result = checkLicenses('MIT', deps);
    expect(result.every((name) => typeof name === 'string')).toBe(true);
    expect(result).not.toContain('GPL-3.0');
  });

  it('flags every dependency when all are copyleft', () => {
    const allCopyleft: PackageInfo[] = [
      { name: 'a', license: 'GPL-3.0' },
      { name: 'b', license: 'LGPL-2.1' },
      { name: 'c', license: 'AGPL-3.0' },
    ];
    expect(checkLicenses('MIT', allCopyleft)).toEqual(['a', 'b', 'c']);
  });

  it('keeps duplicate names that share an incompatible license', () => {
    const dupes: PackageInfo[] = [
      { name: 'dup', license: 'GPL-3.0' },
      { name: 'dup', license: 'GPL-3.0' },
    ];
    expect(checkLicenses('MIT', dupes)).toEqual(['dup', 'dup']);
  });
});

describe('checkLicenses — edge cases', () => {
  it('returns empty for no dependencies', () => {
    expect(checkLicenses('MIT', [])).toEqual([]);
  });

  it('does not mutate the input deps array', () => {
    const input: PackageInfo[] = [
      { name: 'a', license: 'MIT' },
      { name: 'b', license: 'GPL-3.0' },
    ];
    const snapshot = JSON.parse(JSON.stringify(input));
    checkLicenses('MIT', input);
    expect(input).toEqual(snapshot);
  });
});
