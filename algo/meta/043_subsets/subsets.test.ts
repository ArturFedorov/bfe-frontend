import { subsets } from './subsets';

const normalize = (sets: number[][]): number[][] =>
  sets
    .map((s) => [...s].sort((a, b) => a - b))
    .sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return a[i] - b[i];
      }
      return 0;
    });

describe('subsets', () => {
  it('returns the power set of [1, 2, 3]', () => {
    expect(normalize(subsets([1, 2, 3]))).toEqual(
      normalize([[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]),
    );
  });

  it('handles a single element', () => {
    expect(normalize(subsets([0]))).toEqual([[], [0]]);
  });

  it('handles two elements', () => {
    expect(normalize(subsets([5, -1]))).toEqual([[], [-1], [5], [-1, 5]]);
  });

  it('includes the empty subset', () => {
    expect(subsets([4, 7])).toContainEqual([]);
  });

  it('includes the full set', () => {
    const result = normalize(subsets([3, 1, 2]));
    expect(result[result.length - 1]).toEqual([1, 2, 3]);
  });

  it('returns 2^n subsets with no duplicates', () => {
    const result = subsets([1, 2, 3, 4, 5]);
    expect(result).toHaveLength(32);
    const keys = new Set(
      result.map((s) => [...s].sort((a, b) => a - b).join(',')),
    );
    expect(keys.size).toBe(32);
  });

  it('handles negative numbers', () => {
    expect(normalize(subsets([-10, 10]))).toEqual([[], [-10], [10], [-10, 10]]);
  });

  it('returns 1024 subsets for n = 10', () => {
    const nums = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4];
    const result = subsets(nums);
    expect(result).toHaveLength(1024);
    expect(result.reduce((acc, s) => acc + s.length, 0)).toBe(10 * 512);
  });

  it('does not mutate the input', () => {
    const nums = [3, 1, 2];
    subsets(nums);
    expect(nums).toEqual([3, 1, 2]);
  });
});
