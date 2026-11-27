import { findKthLargest } from './kth_largest';

function expected(nums: number[], k: number): number {
  return [...nums].sort((a, b) => b - a)[k - 1];
}

/** Runs on a copy (the function may reorder its input). */
function run(nums: number[], k: number): number {
  return findKthLargest([...nums], k);
}

describe('findKthLargest', () => {
  it('handles [3, 2, 1, 5, 6, 4], k = 2', () => {
    expect(run([3, 2, 1, 5, 6, 4], 2)).toBe(5);
  });

  it('counts duplicates (not distinct values)', () => {
    expect(run([3, 2, 3, 1, 2, 4, 5, 5, 6], 4)).toBe(4);
    expect(run([3, 3, 2], 2)).toBe(3);
  });

  it('handles a single element', () => {
    expect(run([1], 1)).toBe(1);
  });

  it('handles k = 1 (maximum) and k = n (minimum)', () => {
    const nums = [7, -2, 9, 4, 0];
    expect(run(nums, 1)).toBe(9);
    expect(run(nums, nums.length)).toBe(-2);
  });

  it('handles negatives', () => {
    expect(run([-1, -5, -3, -4], 2)).toBe(-3);
  });

  it('handles all elements equal', () => {
    expect(run([2, 2, 2, 2], 3)).toBe(2);
  });

  it('keeps the same multiset of elements', () => {
    const nums = [5, 1, 4, 1, 5, 9, 2, 6];
    findKthLargest(nums, 3);
    expect([...nums].sort((a, b) => a - b)).toEqual([1, 1, 2, 4, 5, 5, 6, 9]);
  });

  it('matches sorting for every k on random arrays', () => {
    let seed = 99;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed;
    };
    for (let t = 0; t < 30; t++) {
      const n = 1 + (rand() % 25);
      const nums = Array.from({ length: n }, () => (rand() % 21) - 10);
      for (let k = 1; k <= n; k++) {
        expect(run(nums, k)).toBe(expected(nums, k));
      }
    }
  });

  describe('large inputs (10^5 elements, < 1 s each)', () => {
    const n = 100_000;

    function timed(nums: number[], k: number, want: number): void {
      const start = performance.now();
      expect(findKthLargest(nums, k)).toBe(want);
      expect(performance.now() - start).toBeLessThan(1000);
    }

    it('ascending input', () => {
      const nums = Array.from(
        { length: n },
        (_, i) => Math.floor(i / 5) - 10_000,
      );
      const want = expected(nums, 50_000);
      timed(nums, 50_000, want);
    });

    it('descending input', () => {
      const nums = Array.from(
        { length: n },
        (_, i) => 9_999 - Math.floor(i / 5),
      );
      const want = expected(nums, 50_000);
      timed(nums, 50_000, want);
    });

    it('all elements equal', () => {
      timed(new Array<number>(n).fill(-7), 50_000, -7);
    });
  });
});
