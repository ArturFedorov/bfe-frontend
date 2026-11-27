import { findPeakElement } from './find_peak_element';

function isPeak(nums: number[], i: number): boolean {
  if (!Number.isInteger(i) || i < 0 || i >= nums.length) return false;
  const left = i === 0 ? -Infinity : nums[i - 1];
  const right = i === nums.length - 1 ? -Infinity : nums[i + 1];
  return nums[i] > left && nums[i] > right;
}

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

function expectPeak(nums: number[]): void {
  const i = findPeakElement(nums);
  expect(isPeak(nums, i)).toBe(true);
}

describe('findPeakElement', () => {
  it('finds the single peak in [1, 2, 3, 1]', () => {
    expect(findPeakElement([1, 2, 3, 1])).toBe(2);
  });

  it('accepts either peak in [1, 2, 1, 3, 5, 6, 4]', () => {
    expect([1, 5]).toContain(findPeakElement([1, 2, 1, 3, 5, 6, 4]));
  });

  it('handles a single element', () => {
    expect(findPeakElement([7])).toBe(0);
  });

  it('handles two elements', () => {
    expect(findPeakElement([1, 2])).toBe(1);
    expect(findPeakElement([2, 1])).toBe(0);
  });

  it('handles a strictly increasing array (peak at the end)', () => {
    expect(findPeakElement([1, 2, 3, 4, 5])).toBe(4);
  });

  it('handles a strictly decreasing array (peak at the start)', () => {
    expect(findPeakElement([5, 4, 3, 2, 1])).toBe(0);
  });

  it('handles negatives and 32-bit boundaries', () => {
    expectPeak([-(2 ** 31), 2 ** 31 - 1, -(2 ** 31)]);
    expectPeak([-5, -3, -4, -1, -2]);
    expectPeak([-(2 ** 31)]);
  });

  it('handles a zig-zag with many peaks', () => {
    expectPeak([1, 3, 2, 4, 3, 5, 4, 6, 5]);
  });

  it('returns a peak on many random arrays', () => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed;
    };
    for (let t = 0; t < 200; t++) {
      const len = 1 + (rand() % 30);
      const nums: number[] = [rand() % 20];
      while (nums.length < len) {
        const v = (rand() % 41) - 20;
        if (v !== nums[nums.length - 1]) nums.push(v);
      }
      expectPeak(nums);
    }
  });

  it('uses O(log n) reads on a large increasing array', () => {
    const n = 100_000;
    const nums = Array.from({ length: n }, (_, i) => i);
    const { arr, reads } = counted(nums);
    expect(findPeakElement(arr)).toBe(n - 1);
    expect(reads()).toBeLessThanOrEqual(2 * Math.log2(n) + 5);
  });

  it('uses O(log n) reads on a large mountain array', () => {
    const n = 100_000;
    const top = 61_803;
    const nums = Array.from({ length: n }, (_, i) =>
      i <= top ? i : 2 * top - i,
    );
    const { arr, reads } = counted(nums);
    expect(findPeakElement(arr)).toBe(top);
    expect(reads()).toBeLessThanOrEqual(2 * Math.log2(n) + 5);
  });
});
