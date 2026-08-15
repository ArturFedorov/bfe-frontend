import { TokenBucket, Clock } from './token_bucket';

function manualClock(start = 0): Clock & { advance: (ms: number) => void } {
  let time = start;
  return {
    now: () => time,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

describe('TokenBucket', () => {
  describe('tryAcquire with a manual clock', () => {
    it('starts full and drains to empty', () => {
      const clock = manualClock();
      const bucket = new TokenBucket({ capacity: 3, refillPerSecond: 1, clock });

      expect(bucket.available()).toBe(3);
      expect(bucket.tryAcquire()).toBe(true);
      expect(bucket.tryAcquire()).toBe(true);
      expect(bucket.tryAcquire()).toBe(true);
      expect(bucket.tryAcquire()).toBe(false);
      expect(bucket.available()).toBe(0);
    });

    it('supports multi-token all-or-nothing acquisition', () => {
      const clock = manualClock();
      const bucket = new TokenBucket({ capacity: 5, refillPerSecond: 1, clock });

      expect(bucket.tryAcquire(3)).toBe(true);
      expect(bucket.tryAcquire(3)).toBe(false); // only 2 left — no partial take
      expect(bucket.available()).toBe(2);
      expect(bucket.tryAcquire(2)).toBe(true);
    });

    it('refills over elapsed time', () => {
      const clock = manualClock();
      const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 1, clock });

      expect(bucket.tryAcquire(2)).toBe(true);
      expect(bucket.tryAcquire()).toBe(false);

      clock.advance(1000);
      expect(bucket.tryAcquire()).toBe(true);
      expect(bucket.tryAcquire()).toBe(false);
    });

    it('accumulates fractional refill', () => {
      const clock = manualClock();
      const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 2, clock });

      expect(bucket.tryAcquire(2)).toBe(true);

      clock.advance(400); // 0.8 tokens — not enough
      expect(bucket.tryAcquire()).toBe(false);

      clock.advance(100); // total 0.5s -> 1.0 tokens
      expect(bucket.tryAcquire()).toBe(true);
    });

    it('caps refill at capacity after long idle periods', () => {
      const clock = manualClock();
      const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 10, clock });

      expect(bucket.tryAcquire(2)).toBe(true);
      clock.advance(60_000);

      expect(bucket.available()).toBe(2);
      expect(bucket.tryAcquire(2)).toBe(true);
      expect(bucket.tryAcquire()).toBe(false);
    });

    it('throws a RangeError when n exceeds capacity', () => {
      const clock = manualClock();
      const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 1, clock });

      expect(() => bucket.tryAcquire(3)).toThrow(RangeError);
    });
  });

  describe('acquire with fake timers (default clock)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('resolves immediately when tokens are available', async () => {
      const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 1 });
      let settled = false;

      bucket.acquire().then(() => {
        settled = true;
      });
      await jest.advanceTimersByTimeAsync(0);

      expect(settled).toBe(true);
      expect(bucket.tryAcquire()).toBe(true); // one token was consumed, one left
      expect(bucket.tryAcquire()).toBe(false);
    });

    it('waits for refill and resolves only once a token exists', async () => {
      const bucket = new TokenBucket({ capacity: 1, refillPerSecond: 1 });
      expect(bucket.tryAcquire()).toBe(true);

      let settled = false;
      bucket.acquire().then(() => {
        settled = true;
      });

      await jest.advanceTimersByTimeAsync(999);
      expect(settled).toBe(false);

      await jest.advanceTimersByTimeAsync(1);
      expect(settled).toBe(true);
    });

    it('serves multiple waiters in FIFO order', async () => {
      const bucket = new TokenBucket({ capacity: 1, refillPerSecond: 1 });
      expect(bucket.tryAcquire()).toBe(true);

      const order: string[] = [];
      bucket.acquire().then(() => order.push('first'));
      bucket.acquire().then(() => order.push('second'));

      await jest.advanceTimersByTimeAsync(1000);
      expect(order).toEqual(['first']);

      await jest.advanceTimersByTimeAsync(1000);
      expect(order).toEqual(['first', 'second']);
    });

    it('an earlier large request is not starved by a later small one', async () => {
      const bucket = new TokenBucket({ capacity: 3, refillPerSecond: 1 });
      expect(bucket.tryAcquire(3)).toBe(true);

      const order: string[] = [];
      bucket.acquire(2).then(() => order.push('large'));
      bucket.acquire(1).then(() => order.push('small'));

      // after 1s there is one token — enough for 'small', but 'large' is first in line
      await jest.advanceTimersByTimeAsync(1000);
      expect(order).toEqual([]);

      await jest.advanceTimersByTimeAsync(1000);
      expect(order).toEqual(['large']);

      await jest.advanceTimersByTimeAsync(1000);
      expect(order).toEqual(['large', 'small']);
    });

    it('acquire(n) with n > capacity throws a RangeError', () => {
      const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 1 });
      expect(() => bucket.acquire(5)).toThrow(RangeError);
    });
  });
});
