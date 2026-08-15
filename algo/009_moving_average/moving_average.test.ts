import { MovingAverage } from './moving_average';

describe('MovingAverage', () => {
  it('averages the last k readings once the window is full', () => {
    const avg = new MovingAverage(3);
    avg.next(1);
    avg.next(5);
    avg.next(3);
    expect(avg.next(7)).toBe(5); // (5 + 3 + 7) / 3
    expect(avg.next(2)).toBe(4); // (3 + 7 + 2) / 3
  });

  it('averages everything seen so far during warm-up', () => {
    const avg = new MovingAverage(4);
    expect(avg.next(2)).toBe(2);
    expect(avg.next(4)).toBe(3);
    expect(avg.next(6)).toBe(4);
  });

  it('returns the reading itself when k = 1', () => {
    const avg = new MovingAverage(1);
    expect(avg.next(10)).toBe(10);
    expect(avg.next(-3)).toBe(-3);
    expect(avg.next(0.5)).toBe(0.5);
  });

  it('stays constant when every reading is identical', () => {
    const avg = new MovingAverage(5);
    for (let i = 0; i < 20; i++) {
      expect(avg.next(7)).toBe(7);
    }
  });

  it('handles negative and fractional readings', () => {
    const avg = new MovingAverage(2);
    expect(avg.next(-4)).toBe(-4);
    expect(avg.next(1)).toBe(-1.5);
    expect(avg.next(2.5)).toBe(1.75);
  });

  it('throws a RangeError for invalid window sizes', () => {
    expect(() => new MovingAverage(0)).toThrow(RangeError);
    expect(() => new MovingAverage(-2)).toThrow(RangeError);
    expect(() => new MovingAverage(1.5)).toThrow(RangeError);
  });

  it('processes 100_000 readings with a 50_000-wide window in time', () => {
    const n = 100_000;
    const k = 50_000;
    const readings: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
      readings[i] = i % 1000;
    }

    // Expected values via prefix sums (test-side O(n) reference).
    const prefix: number[] = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) {
      prefix[i + 1] = prefix[i] + readings[i];
    }
    const expectedAt = (i: number): number => {
      const start = Math.max(0, i - k + 1);
      return (prefix[i + 1] - prefix[start]) / (i - start + 1);
    };

    const avg = new MovingAverage(k);
    const results: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
      results[i] = avg.next(readings[i]);
    }

    expect(results[0]).toBe(0);
    expect(results[k - 1]).toBeCloseTo(expectedAt(k - 1), 6);
    expect(results[70_000]).toBeCloseTo(expectedAt(70_000), 6);
    expect(results[n - 1]).toBeCloseTo(499.5, 6);
  });
});
