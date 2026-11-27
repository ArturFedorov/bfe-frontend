import { search } from './search_rotated_array';

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

function rotate(sorted: number[], p: number): number[] {
  return [...sorted.slice(p), ...sorted.slice(0, p)];
}

describe('search', () => {
  it('finds a target in the rotated tail', () => {
    expect(search([4, 5, 6, 7, 0, 1, 2], 0)).toBe(4);
  });

  it('returns -1 for a missing target', () => {
    expect(search([4, 5, 6, 7, 0, 1, 2], 3)).toBe(-1);
  });

  it('handles a single element', () => {
    expect(search([1], 0)).toBe(-1);
    expect(search([1], 1)).toBe(0);
  });

  it('handles an empty array', () => {
    expect(search([], 5)).toBe(-1);
  });

  it('handles an unrotated array', () => {
    expect(search([1, 2, 3, 4, 5], 1)).toBe(0);
    expect(search([1, 2, 3, 4, 5], 5)).toBe(4);
    expect(search([1, 2, 3, 4, 5], 6)).toBe(-1);
  });

  it('handles two elements in both orders', () => {
    expect(search([3, 1], 1)).toBe(1);
    expect(search([3, 1], 3)).toBe(0);
    expect(search([1, 3], 3)).toBe(1);
    expect(search([3, 1], 2)).toBe(-1);
  });

  it('finds the pivot neighbours', () => {
    const nums = [6, 7, 8, 9, 1, 2, 3];
    expect(search(nums, 9)).toBe(3);
    expect(search(nums, 1)).toBe(4);
  });

  it('handles negatives and extremes', () => {
    const nums = [0, 1e9, -1e9, -7, -3];
    expect(search(nums, -1e9)).toBe(2);
    expect(search(nums, 1e9)).toBe(1);
    expect(search(nums, -3)).toBe(4);
    expect(search(nums, -5)).toBe(-1);
  });

  it('finds every element for every rotation of a small array', () => {
    const sorted = [-4, -1, 0, 3, 5, 8, 13, 21];
    for (let p = 0; p < sorted.length; p++) {
      const nums = rotate(sorted, p);
      nums.forEach((v, i) => expect(search(nums, v)).toBe(i));
      for (const missing of [-5, -2, 4, 22]) {
        expect(search(nums, missing)).toBe(-1);
      }
    }
  });

  it('uses O(log n) reads on large rotated arrays', () => {
    const n = 100_000;
    const sorted = Array.from({ length: n }, (_, i) => 2 * i);
    for (const p of [0, 1, 37_123, n / 2, n - 1]) {
      const nums = rotate(sorted, p);
      for (const [target, expected] of [
        [nums[0], 0],
        [nums[n - 1], n - 1],
        [nums[12_345], 12_345],
        [nums[87_654], 87_654],
        [7, -1],
        [-2, -1],
        [2 * n, -1],
      ]) {
        const { arr, reads } = counted(nums);
        expect(search(arr, target)).toBe(expected);
        expect(reads()).toBeLessThanOrEqual(6 * Math.log2(n) + 10);
      }
    }
  });
});
