import { topKFrequent } from './top_k_frequent';

const sorted = (xs: number[]): number[] => [...xs].sort((a, b) => a - b);

describe('topKFrequent', () => {
  it('returns the two most frequent values', () => {
    expect(sorted(topKFrequent([1, 1, 1, 2, 2, 3], 2))).toEqual([1, 2]);
  });

  it('handles a single element', () => {
    expect(topKFrequent([1], 1)).toEqual([1]);
  });

  it('handles negative values', () => {
    expect(topKFrequent([4, 4, -1, -1, -1, 7], 1)).toEqual([-1]);
  });

  it('returns every distinct value when k equals the distinct count', () => {
    expect(sorted(topKFrequent([5, 3, 5, 3, 9], 3))).toEqual([3, 5, 9]);
  });

  it('does not depend on input order', () => {
    expect(sorted(topKFrequent([3, 1, 2, 1, 3, 3, 2, 1, 3], 2))).toEqual([
      1, 3,
    ]);
  });

  it('handles all identical values', () => {
    expect(topKFrequent([7, 7, 7, 7], 1)).toEqual([7]);
  });

  it('handles zero and boundary values', () => {
    expect(
      sorted(topKFrequent([0, 0, -10000, 10000, 10000, 0, 10000, 5], 2)),
    ).toEqual([0, 10000]);
  });

  it('returns exactly k values', () => {
    const result = topKFrequent([1, 1, 1, 1, 2, 2, 2, 3, 3, 4], 3);
    expect(result).toHaveLength(3);
    expect(sorted(result)).toEqual([1, 2, 3]);
  });

  it('works when the most frequent value appears last', () => {
    expect(topKFrequent([1, 2, 3, 4, 9, 9], 1)).toEqual([9]);
  });

  it('does not mutate the input', () => {
    const nums = [3, 3, 1, 2, 2, 2];
    topKFrequent(nums, 2);
    expect(nums).toEqual([3, 3, 1, 2, 2, 2]);
  });

  it('is fast on a large input', () => {
    // Value v (0..9999) appears (v % 10) + 1 times; top value set is
    // every v with v % 10 === 9 (1000 values, each appearing 10 times).
    const nums: number[] = [];
    for (let v = 0; v < 10_000; v++) {
      for (let c = 0; c <= v % 10; c++) nums.push(v - 5000);
    }
    // Shuffle deterministically.
    for (let i = nums.length - 1; i > 0; i--) {
      const j = (i * 7919) % (i + 1);
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    const expected: number[] = [];
    for (let v = 9; v < 10_000; v += 10) expected.push(v - 5000);

    expect(sorted(topKFrequent(nums, 1000))).toEqual(expected);
  });
});
