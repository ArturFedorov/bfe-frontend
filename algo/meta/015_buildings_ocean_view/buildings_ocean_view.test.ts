import { findBuildings } from './buildings_ocean_view';

describe('findBuildings', () => {
  it('[4,2,3,1] -> [0,2,3]', () => {
    expect(findBuildings([4, 2, 3, 1])).toEqual([0, 2, 3]);
  });

  it('strictly decreasing: every building sees the ocean', () => {
    expect(findBuildings([4, 3, 2, 1])).toEqual([0, 1, 2, 3]);
  });

  it('tallest at the end blocks everything', () => {
    expect(findBuildings([1, 3, 2, 4])).toEqual([3]);
  });

  it('equal heights block the view', () => {
    expect(findBuildings([2, 2, 2, 2])).toEqual([3]);
  });

  it('single building', () => {
    expect(findBuildings([5])).toEqual([0]);
  });

  it('strictly increasing: only the last', () => {
    expect(findBuildings([1, 2, 3, 4, 5])).toEqual([4]);
  });

  it('equal to a later building is blocked, taller than all later is not', () => {
    expect(findBuildings([3, 1, 3, 2])).toEqual([2, 3]);
    expect(findBuildings([5, 1, 3, 2, 1])).toEqual([0, 2, 3, 4]);
  });

  it('returns indices in increasing order', () => {
    const result = findBuildings([9, 8, 1, 7, 2, 6, 3]);
    expect(result).toEqual([0, 1, 3, 5, 6]);
  });

  it('large heights', () => {
    expect(findBuildings([1_000_000_000, 999_999_999, 1_000_000_000])).toEqual([
      2,
    ]);
  });

  it('large input (10^5) in linear time', () => {
    const n = 100_000;
    const desc = Array.from({ length: n }, (_, i) => n - i);
    const result = findBuildings(desc);
    expect(result.length).toBe(n);
    expect(result[0]).toBe(0);
    expect(result[n - 1]).toBe(n - 1);
    const flat = new Array<number>(n).fill(7);
    expect(findBuildings(flat)).toEqual([n - 1]);
  });
});
