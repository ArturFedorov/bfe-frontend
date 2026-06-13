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
});
