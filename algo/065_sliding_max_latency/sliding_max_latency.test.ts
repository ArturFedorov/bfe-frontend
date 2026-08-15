import { SlidingMaxLatency } from './sliding_max_latency';

describe('SlidingMaxLatency', () => {
  describe('happy path', () => {
    it('tracks the max as old values fall out of the window', () => {
      const w = new SlidingMaxLatency(3);
      expect(w.record(120)).toBe(120);
      expect(w.record(80)).toBe(120);
      expect(w.record(95)).toBe(120);
      expect(w.record(70)).toBe(95);
      expect(w.record(200)).toBe(200);
    });

    it('reports the max over fewer than N values while warming up', () => {
      const w = new SlidingMaxLatency(5);
      expect(w.record(10)).toBe(10);
      expect(w.record(30)).toBe(30);
      expect(w.record(20)).toBe(30);
    });

    it('follows a rising then falling series', () => {
      const w = new SlidingMaxLatency(2);
      expect(w.record(1)).toBe(1);
      expect(w.record(2)).toBe(2);
      expect(w.record(3)).toBe(3);
      expect(w.record(2)).toBe(3);
      expect(w.record(1)).toBe(2);
      expect(w.record(0)).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('window size 1 always returns the value just recorded', () => {
      const w = new SlidingMaxLatency(1);
      expect(w.record(50)).toBe(50);
      expect(w.record(10)).toBe(10);
      expect(w.record(99)).toBe(99);
    });

    it('handles duplicate values leaving the window one at a time', () => {
      const w = new SlidingMaxLatency(2);
      expect(w.record(7)).toBe(7);
      expect(w.record(7)).toBe(7);
      expect(w.record(3)).toBe(7);
      expect(w.record(3)).toBe(3);
    });

    it('handles zero and fractional latencies', () => {
      const w = new SlidingMaxLatency(3);
      expect(w.record(0)).toBe(0);
      expect(w.record(0.5)).toBe(0.5);
      expect(w.record(0.25)).toBe(0.5);
    });

    it('handles a strictly decreasing stream (deque at full length)', () => {
      const w = new SlidingMaxLatency(3);
      expect(w.record(9)).toBe(9);
      expect(w.record(8)).toBe(9);
      expect(w.record(7)).toBe(9);
      expect(w.record(6)).toBe(8);
      expect(w.record(5)).toBe(7);
    });
  });

  describe('constructor validation', () => {
    it.each([
      ['zero', 0],
      ['negative', -2],
      ['non-integer', 1.5],
      ['NaN', NaN],
    ])('throws on %s window size', (_label, size) => {
      expect(() => new SlidingMaxLatency(size)).toThrow();
    });
  });

  describe('large input', () => {
    it('processes 100_000 records with window 500 in amortized O(1)', () => {
      const n = 100_000;
      const windowSize = 500;
      const values = Array.from({ length: n }, (_, i) => (i * 37) % 1000);
      const w = new SlidingMaxLatency(windowSize);
      const results: number[] = [];
      for (const v of values) {
        results.push(w.record(v));
      }
      expect(results).toHaveLength(n);

      // Spot-check a handful of windows against a naive O(k) reference.
      const naiveMax = (endIndex: number): number => {
        const start = Math.max(0, endIndex - windowSize + 1);
        let max = -Infinity;
        for (let i = start; i <= endIndex; i++) {
          if (values[i] > max) max = values[i];
        }
        return max;
      };
      for (const idx of [0, 1, 499, 500, 1_234, 50_000, 99_999]) {
        expect(results[idx]).toBe(naiveMax(idx));
      }
    });

    it('handles a strictly decreasing 100_000-value stream', () => {
      const n = 100_000;
      const windowSize = 1_000;
      const w = new SlidingMaxLatency(windowSize);
      let last = 0;
      for (let i = 0; i < n; i++) {
        last = w.record(n - i);
      }
      // Window holds [windowSize, ..., 1]; the max is the oldest value in it.
      expect(last).toBe(windowSize);
    });
  });
});
