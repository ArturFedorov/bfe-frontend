import { capacityTriplet } from './capacity_triplet';

describe('capacityTriplet', () => {
  it('finds all distinct triples in an unsorted catalog', () => {
    expect(capacityTriplet([8, 2, 6, 4, 2, 10], 16)).toEqual([
      [2, 4, 10],
      [2, 6, 8],
    ]);
  });

  it('returns a single triple when only one combination works', () => {
    expect(capacityTriplet([1, 2, 3, 100], 6)).toEqual([[1, 2, 3]]);
  });

  it('reports each multiset of sizes once despite duplicate entries', () => {
    expect(capacityTriplet([1, 1, 1, 1], 3)).toEqual([[1, 1, 1]]);
    expect(capacityTriplet([2, 2, 2, 4, 4, 4, 6], 12)).toEqual([
      [2, 4, 6],
      [4, 4, 4],
    ]);
  });

  it('allows equal sizes from different entries inside one triple', () => {
    expect(capacityTriplet([5, 5, 5], 15)).toEqual([[5, 5, 5]]);
    expect(capacityTriplet([0, 0, 0], 0)).toEqual([[0, 0, 0]]);
  });

  it('does not reuse a single entry twice', () => {
    // 5 + 5 + 5 = 15 but only two entries of size 5 exist.
    expect(capacityTriplet([5, 5, 4], 15)).toEqual([]);
  });

  it('returns [] when no triple hits the capacity', () => {
    expect(capacityTriplet([1, 2, 4, 8], 100)).toEqual([]);
    expect(capacityTriplet([10, 20, 30], 5)).toEqual([]);
  });

  it('returns [] for catalogs with fewer than three entries', () => {
    expect(capacityTriplet([], 10)).toEqual([]);
    expect(capacityTriplet([10], 10)).toEqual([]);
    expect(capacityTriplet([5, 5], 15)).toEqual([]);
  });

  it('orders triples lexicographically with each triple ascending', () => {
    const result = capacityTriplet([9, 1, 5, 3, 7, 2, 8, 4, 6], 12);
    expect(result).toEqual([
      [1, 2, 9],
      [1, 3, 8],
      [1, 4, 7],
      [1, 5, 6],
      [2, 3, 7],
      [2, 4, 6],
      [3, 4, 5],
    ]);
  });

  it('handles a catalog where every entry participates', () => {
    expect(capacityTriplet([2, 2, 2], 6)).toEqual([[2, 2, 2]]);
  });

  it('finds the exact triples in a 4_000-entry catalog within the quadratic budget', () => {
    const sizes: number[] = [];
    for (let v = 3; v <= 2002; v++) {
      sizes.push(v, v); // every size 3..2002 appears twice
    }
    sizes.reverse(); // make sure the input is not pre-sorted ascending
    expect(sizes).toHaveLength(4_000);
    expect(capacityTriplet(sizes, 12)).toEqual([
      [3, 3, 6],
      [3, 4, 5],
    ]);
  });
});
