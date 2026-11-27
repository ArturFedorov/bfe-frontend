import { searchRange } from './search_range';

/** Wraps `nums` in a Proxy that counts indexed element reads. */
function counted(nums: number[]): { arr: number[]; reads: () => number } {
  let reads = 0;
  const arr = new Proxy(nums, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) reads++;
      return Reflect.get(target, prop, receiver);
    },
  });
  return { arr, reads: () => reads };
}

describe('searchRange', () => {
  it('finds a duplicated target', () => {
    expect(searchRange([5, 7, 7, 8, 8, 10], 8)).toEqual([3, 4]);
  });

  it('returns [-1, -1] for a missing target inside the range', () => {
    expect(searchRange([5, 7, 7, 8, 8, 10], 6)).toEqual([-1, -1]);
  });

  it('handles an empty array', () => {
    expect(searchRange([], 0)).toEqual([-1, -1]);
  });

  it('handles a single element', () => {
    expect(searchRange([1], 1)).toEqual([0, 0]);
    expect(searchRange([1], 2)).toEqual([-1, -1]);
    expect(searchRange([1], 0)).toEqual([-1, -1]);
  });

  it('handles targets outside the value range', () => {
    expect(searchRange([2, 3, 4], 1)).toEqual([-1, -1]);
    expect(searchRange([2, 3, 4], 5)).toEqual([-1, -1]);
  });

  it('finds targets at both ends', () => {
    expect(searchRange([1, 1, 2, 3, 3], 1)).toEqual([0, 1]);
    expect(searchRange([1, 1, 2, 3, 3], 3)).toEqual([3, 4]);
  });

  it('finds a unique target', () => {
    expect(searchRange([1, 2, 3, 4, 5], 3)).toEqual([2, 2]);
  });

  it('handles an array where every element is the target', () => {
    expect(searchRange([4, 4, 4, 4], 4)).toEqual([0, 3]);
  });

  it('handles negatives and extremes', () => {
    expect(searchRange([-1e9, -5, -5, 0, 1e9], -5)).toEqual([1, 2]);
    expect(searchRange([-1e9, -5, -5, 0, 1e9], -1e9)).toEqual([0, 0]);
    expect(searchRange([-1e9, -5, -5, 0, 1e9], 1e9)).toEqual([4, 4]);
  });

  it('returns [-1, -1] for a gap between duplicated runs', () => {
    expect(searchRange([1, 1, 1, 3, 3, 3], 2)).toEqual([-1, -1]);
  });

  it('uses O(log n) reads when the whole array is the target', () => {
    const n = 100_000;
    const { arr, reads } = counted(new Array<number>(n).fill(7));
    expect(searchRange(arr, 7)).toEqual([0, n - 1]);
    expect(reads()).toBeLessThanOrEqual(4 * Math.log2(n) + 10);
  });

  it('uses O(log n) reads on a long run in a large array', () => {
    const n = 100_000;
    const nums = Array.from({ length: n }, (_, i) => Math.floor(i / 30_000));
    for (const [target, expected] of [
      [0, [0, 29_999]],
      [1, [30_000, 59_999]],
      [3, [90_000, 99_999]],
      [-1, [-1, -1]],
      [4, [-1, -1]],
    ] as Array<[number, [number, number]]>) {
      const { arr, reads } = counted(nums);
      expect(searchRange(arr, target)).toEqual(expected);
      expect(reads()).toBeLessThanOrEqual(4 * Math.log2(n) + 10);
    }
  });
});
