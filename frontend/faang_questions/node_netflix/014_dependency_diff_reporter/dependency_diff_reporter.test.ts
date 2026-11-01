import { reportNewPackages } from './dependency_diff_reporter';

describe('reportNewPackages', () => {
  it('reports added packages with risk', () => {
    const before = { a: '1.0.0' };
    const after = { a: '1.0.0', b: '2.0.0', evil: '0.0.1' };
    expect(reportNewPackages(before, after, ['evil'])).toEqual([
      { name: 'b', version: '2.0.0', risk: 'low' },
      { name: 'evil', version: '0.0.1', risk: 'high' },
    ]);
  });

  it('returns empty when nothing was added', () => {
    expect(reportNewPackages({ a: '1.0.0' }, { a: '1.0.0' }, [])).toEqual([]);
  });

  it('treats every package as added when before is empty', () => {
    expect(
      reportNewPackages({}, { left: '1.0.0', right: '2.0.0' }, ['right']),
    ).toEqual([
      { name: 'left', version: '1.0.0', risk: 'low' },
      { name: 'right', version: '2.0.0', risk: 'high' },
    ]);
  });

  it('returns empty when after is empty', () => {
    expect(reportNewPackages({ a: '1.0.0' }, {}, [])).toEqual([]);
  });
});

describe('reportNewPackages — what counts as "added"', () => {
  it('ignores packages that were removed', () => {
    const before = { a: '1.0.0', b: '2.0.0' };
    const after = { a: '1.0.0' };
    expect(reportNewPackages(before, after, [])).toEqual([]);
  });

  it('does not report a version bump of an existing package', () => {
    // 'a' already existed, so it is not a newly added package
    const before = { a: '1.0.0' };
    const after = { a: '2.0.0' };
    expect(reportNewPackages(before, after, [])).toEqual([]);
  });

  it('reports only the genuinely new packages amid bumps and removals', () => {
    const before = { keep: '1.0.0', bump: '1.0.0', drop: '1.0.0' };
    const after = { keep: '1.0.0', bump: '2.0.0', fresh: '0.1.0' };
    expect(reportNewPackages(before, after, [])).toEqual([
      { name: 'fresh', version: '0.1.0', risk: 'low' },
    ]);
  });

  it('reports a package that reappears under a name absent from before', () => {
    const before = { a: '1.0.0' };
    const after = { a: '1.0.0', '@scope/pkg': '3.2.1' };
    expect(reportNewPackages(before, after, [])).toEqual([
      { name: '@scope/pkg', version: '3.2.1', risk: 'low' },
    ]);
  });
});

describe('reportNewPackages — risk assessment', () => {
  it('marks multiple risky additions as high and the rest as low', () => {
    const after = {
      safe1: '1.0.0',
      bad1: '1.0.0',
      safe2: '1.0.0',
      bad2: '1.0.0',
    };
    expect(reportNewPackages({}, after, ['bad1', 'bad2'])).toEqual([
      { name: 'safe1', version: '1.0.0', risk: 'low' },
      { name: 'bad1', version: '1.0.0', risk: 'high' },
      { name: 'safe2', version: '1.0.0', risk: 'low' },
      { name: 'bad2', version: '1.0.0', risk: 'high' },
    ]);
  });

  it('ignores knownRisky entries that were not added', () => {
    // 'ghost' is risky but never appears in after; 'old' is risky but pre-existing
    const before = { old: '1.0.0' };
    const after = { old: '1.0.0', neo: '1.0.0' };
    expect(reportNewPackages(before, after, ['ghost', 'old'])).toEqual([
      { name: 'neo', version: '1.0.0', risk: 'low' },
    ]);
  });

  it('is case-sensitive when matching risky names', () => {
    const after = { Evil: '1.0.0' };
    // knownRisky lists lowercase 'evil', which should not match 'Evil'
    expect(reportNewPackages({}, after, ['evil'])).toEqual([
      { name: 'Evil', version: '1.0.0', risk: 'low' },
    ]);
  });

  it('handles an empty knownRisky list (everything is low risk)', () => {
    expect(reportNewPackages({}, { a: '1.0.0', b: '2.0.0' }, [])).toEqual([
      { name: 'a', version: '1.0.0', risk: 'low' },
      { name: 'b', version: '2.0.0', risk: 'low' },
    ]);
  });

  it('tolerates duplicate entries in knownRisky', () => {
    expect(reportNewPackages({}, { evil: '0.0.1' }, ['evil', 'evil'])).toEqual([
      { name: 'evil', version: '0.0.1', risk: 'high' },
    ]);
  });
});

describe('reportNewPackages — output shape', () => {
  it('follows the insertion order of the after map', () => {
    const after = { zeta: '1.0.0', alpha: '1.0.0', mid: '1.0.0' };
    const result = reportNewPackages({}, after, []);
    expect(result.map((r) => r.name)).toEqual(['zeta', 'alpha', 'mid']);
  });

  it('preserves version strings verbatim, including prerelease tags', () => {
    const after = { pkg: '2.0.0-beta.1+build.7' };
    expect(reportNewPackages({}, after, [])).toEqual([
      { name: 'pkg', version: '2.0.0-beta.1+build.7', risk: 'low' },
    ]);
  });

  it('does not mutate the input maps', () => {
    const before = { a: '1.0.0' };
    const after = { a: '1.0.0', b: '2.0.0' };
    const beforeCopy = { ...before };
    const afterCopy = { ...after };
    reportNewPackages(before, after, ['b']);
    expect(before).toEqual(beforeCopy);
    expect(after).toEqual(afterCopy);
  });
});
