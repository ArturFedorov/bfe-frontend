import { diffLockfiles } from './lockfile_differ';

const before = { a: '1.0.0', b: '2.0.0', c: '3.0.0' };
const after = { a: '1.0.0', b: '2.1.0', d: '4.0.0' };

describe('diffLockfiles', () => {
  it('reports added packages', () => {
    expect(diffLockfiles(before, after).added).toEqual(['d']);
  });

  it('reports removed packages', () => {
    expect(diffLockfiles(before, after).removed).toEqual(['c']);
  });

  it('reports changed packages with version diff', () => {
    expect(diffLockfiles(before, after).changed).toEqual([
      { name: 'b', from: '2.0.0', to: '2.1.0' },
    ]);
  });
});
