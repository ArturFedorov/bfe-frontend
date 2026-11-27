import { findKthPositive } from './kth_missing_positive';

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

function bruteForce(arr: number[], k: number): number {
  const present = new Set(arr);
  let missing = 0;
  for (let x = 1; ; x++) {
    if (!present.has(x) && ++missing === k) return x;
  }
}

describe('findKthPositive', () => {
  it('handles [2, 3, 4, 7, 11], k = 5', () => {
    expect(findKthPositive([2, 3, 4, 7, 11], 5)).toBe(9);
  });

  it('handles a prefix with nothing missing', () => {
    expect(findKthPositive([1, 2, 3, 4], 2)).toBe(6);
  });

  it('answers before the first element', () => {
    expect(findKthPositive([5, 6, 7], 3)).toBe(3);
    expect(findKthPositive([2], 1)).toBe(1);
  });

  it('answers in a gap in the middle', () => {
    expect(findKthPositive([1, 3, 6, 10], 3)).toBe(5);
  });

  it('handles an empty array', () => {
    expect(findKthPositive([], 1)).toBe(1);
    expect(findKthPositive([], 42)).toBe(42);
  });

  it('handles a single element', () => {
    expect(findKthPositive([1], 1)).toBe(2);
    expect(findKthPositive([3], 2)).toBe(2);
    expect(findKthPositive([3], 3)).toBe(4);
  });

  it('handles k landing exactly on the boundary after the last element', () => {
    expect(findKthPositive([2, 4], 2)).toBe(3);
    expect(findKthPositive([2, 4], 3)).toBe(5);
  });

  it('handles very large values and k', () => {
    expect(findKthPositive([1_000_000_000], 1_000_000_000)).toBe(1_000_000_001);
    expect(findKthPositive([1, 1_000_000_000], 999_999_998)).toBe(999_999_999);
  });

  it('matches a brute force on many small inputs', () => {
    for (let mask = 0; mask < 1 << 10; mask += 7) {
      const arr: number[] = [];
      for (let b = 0; b < 10; b++) if (mask & (1 << b)) arr.push(b + 1);
      for (let k = 1; k <= 12; k++) {
        expect(findKthPositive(arr, k)).toBe(bruteForce(arr, k));
      }
    }
  });

  it('uses O(log n) reads on a large array', () => {
    const n = 100_000;
    // Even numbers 2, 4, …, 2n: missing are the odd numbers.
    const nums = Array.from({ length: n }, (_, i) => 2 * (i + 1));
    const cases: Array<[number, number]> = [
      [1, 1],
      [70_000, 139_999],
      [n, 2 * n - 1],
      [n + 1, 2 * n + 1],
      [n + 50, 2 * n + 50],
    ];
    for (const [k, expected] of cases) {
      const { arr, reads } = counted(nums);
      expect(findKthPositive(arr, k)).toBe(expected);
      expect(reads()).toBeLessThanOrEqual(2 * Math.log2(n) + 5);
    }
  });
});
