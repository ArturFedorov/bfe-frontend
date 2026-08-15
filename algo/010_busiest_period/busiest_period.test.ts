import { busiestPeriod } from './busiest_period';

describe('busiestPeriod', () => {
  it('finds the k-hour window with the highest total', () => {
    expect(busiestPeriod([3, 1, 4, 1, 5, 9, 2, 6], 3)).toBe(5);
    expect(busiestPeriod([1, 2, 3, 4, 5], 2)).toBe(3);
  });

  it('returns the earliest start on ties', () => {
    expect(busiestPeriod([10, 2, 2, 10], 2)).toBe(0);
    expect(busiestPeriod([5, 5, 5, 5], 2)).toBe(0);
    expect(busiestPeriod([5, 5, 5, 5], 1)).toBe(0);
  });

  it('handles k = 1 as a plain max scan', () => {
    expect(busiestPeriod([4, 9, 1, 9, 2], 1)).toBe(1);
    expect(busiestPeriod([42], 1)).toBe(0);
  });

  it('returns 0 when k equals the array length', () => {
    expect(busiestPeriod([7, 7, 7], 3)).toBe(0);
    expect(busiestPeriod([1, 2], 2)).toBe(0);
  });

  it('handles all-identical elements', () => {
    expect(busiestPeriod([3, 3, 3, 3, 3, 3], 4)).toBe(0);
  });

  it('handles zero-traffic hours', () => {
    expect(busiestPeriod([0, 0, 8, 0, 0], 2)).toBe(1); // ties at 8: starts 1 and 2
    expect(busiestPeriod([0, 0, 0], 2)).toBe(0);
  });

  it('throws a RangeError for invalid k', () => {
    expect(() => busiestPeriod([1, 2, 3], 0)).toThrow(RangeError);
    expect(() => busiestPeriod([1, 2, 3], 4)).toThrow(RangeError);
    expect(() => busiestPeriod([1, 2, 3], -1)).toThrow(RangeError);
    expect(() => busiestPeriod([1, 2, 3], 1.5)).toThrow(RangeError);
    expect(() => busiestPeriod([], 1)).toThrow(RangeError);
  });

  it('finds a planted peak in 100_000 hours with a 50_000-hour window', () => {
    const n = 100_000;
    const k = 50_000;
    const requests: number[] = new Array(n).fill(1);
    // A 100-hour surge; every window covering all of it ties, earliest wins.
    for (let i = 70_000; i < 70_100; i++) {
      requests[i] = 10;
    }
    expect(busiestPeriod(requests, k)).toBe(70_099 - k + 1); // 20_100
  });
});
