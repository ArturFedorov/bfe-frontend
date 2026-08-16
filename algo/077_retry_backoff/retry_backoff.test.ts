import { retry } from './retry_backoff';

/** Sleep stub that records requested delays and resolves on a microtask. */
function recordingSleep(): {
  sleep: (ms: number) => Promise<void>;
  delays: number[];
} {
  const delays: number[] = [];
  return {
    delays,
    sleep: (ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    },
  };
}

/** fn that fails `failures` times, then resolves with `value`. */
function flaky<T>(
  failures: number,
  value: T,
  makeError: (i: number) => unknown = (i) => new Error(`fail ${i}`),
): { fn: (attempt: number) => Promise<T>; attempts: number[] } {
  const attempts: number[] = [];
  return {
    attempts,
    fn: (attempt: number) => {
      attempts.push(attempt);
      if (attempts.length <= failures) {
        return Promise.reject(makeError(attempts.length - 1));
      }
      return Promise.resolve(value);
    },
  };
}

describe('retry', () => {
  describe('happy path', () => {
    it('resolves on first success without sleeping', async () => {
      const { sleep, delays } = recordingSleep();
      const { fn, attempts } = flaky(0, 'ok');

      await expect(retry(fn, { retries: 3, baseMs: 100, sleep })).resolves.toBe(
        'ok',
      );
      expect(attempts).toEqual([0]);
      expect(delays).toEqual([]);
    });

    it('retries until success and passes the attempt number to fn', async () => {
      const { sleep } = recordingSleep();
      const { fn, attempts } = flaky(2, 'recovered');

      await expect(retry(fn, { retries: 3, baseMs: 100, sleep })).resolves.toBe(
        'recovered',
      );
      expect(attempts).toEqual([0, 1, 2]);
    });
  });

  describe('backoff schedule', () => {
    it('doubles the delay on each retry', async () => {
      const { sleep, delays } = recordingSleep();
      const { fn } = flaky(3, 'ok');

      await retry(fn, { retries: 3, baseMs: 100, sleep });
      expect(delays).toEqual([100, 200, 400]);
    });

    it('caps every delay at maxMs', async () => {
      const { sleep, delays } = recordingSleep();
      const { fn } = flaky(4, 'ok');

      await retry(fn, { retries: 4, baseMs: 100, maxMs: 250, sleep });
      expect(delays).toEqual([100, 200, 250, 250]);
    });

    it('applies deterministic full jitter via the injected random', async () => {
      const { sleep, delays } = recordingSleep();
      const { fn } = flaky(2, 'ok');

      await retry(fn, {
        retries: 2,
        baseMs: 100,
        jitter: true,
        random: () => 0.5,
        sleep,
      });
      expect(delays).toEqual([50, 100]);
    });

    it('jitters the capped delay, not the raw one', async () => {
      const { sleep, delays } = recordingSleep();
      const { fn } = flaky(3, 'ok');

      await retry(fn, {
        retries: 3,
        baseMs: 100,
        maxMs: 200,
        jitter: true,
        random: () => 0.5,
        sleep,
      });
      // raw: 100, 200, 400 -> capped: 100, 200, 200 -> jittered: 50, 100, 100
      expect(delays).toEqual([50, 100, 100]);
    });

    it('does not sleep after the final failed attempt', async () => {
      const { sleep, delays } = recordingSleep();
      const { fn } = flaky(10, 'never');

      await expect(
        retry(fn, { retries: 2, baseMs: 100, sleep }),
      ).rejects.toThrow('fail 2');
      expect(delays).toEqual([100, 200]);
    });
  });

  describe('rejection paths', () => {
    it('rejects with the last error after exhausting retries', async () => {
      const { sleep } = recordingSleep();
      const errors = [new Error('e0'), new Error('e1'), new Error('e2')];
      const { fn, attempts } = flaky(3, 'never', (i) => errors[i]);

      await expect(retry(fn, { retries: 2, baseMs: 10, sleep })).rejects.toBe(
        errors[2],
      );
      expect(attempts).toEqual([0, 1, 2]);
    });

    it('retries: 0 means exactly one attempt', async () => {
      const { sleep, delays } = recordingSleep();
      const { fn, attempts } = flaky(1, 'never');

      await expect(
        retry(fn, { retries: 0, baseMs: 100, sleep }),
      ).rejects.toThrow('fail 0');
      expect(attempts).toEqual([0]);
      expect(delays).toEqual([]);
    });

    it('rejects immediately on a non-retryable error without another attempt', async () => {
      const { sleep, delays } = recordingSleep();
      const fatal = Object.assign(new Error('fatal'), { retryable: false });
      const attempts: number[] = [];
      const fn = (attempt: number) => {
        attempts.push(attempt);
        return Promise.reject(fatal);
      };

      await expect(
        retry(fn, {
          retries: 5,
          baseMs: 100,
          sleep,
          isRetryable: (e) =>
            (e as { retryable?: boolean }).retryable !== false,
        }),
      ).rejects.toBe(fatal);
      expect(attempts).toEqual([0]);
      expect(delays).toEqual([]);
    });

    it('consults isRetryable per error: retryable first, fatal second', async () => {
      const { sleep, delays } = recordingSleep();
      const soft = Object.assign(new Error('soft'), { retryable: true });
      const hard = Object.assign(new Error('hard'), { retryable: false });
      const errors = [soft, hard];
      const attempts: number[] = [];
      const fn = (attempt: number) => {
        attempts.push(attempt);
        return Promise.reject(errors[attempts.length - 1]);
      };

      await expect(
        retry(fn, {
          retries: 5,
          baseMs: 100,
          sleep,
          isRetryable: (e) => (e as { retryable: boolean }).retryable,
        }),
      ).rejects.toBe(hard);
      expect(attempts).toEqual([0, 1]);
      expect(delays).toEqual([100]);
    });
  });

  describe('default sleep with fake timers', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('waits baseMs between attempts using real timer scheduling', async () => {
      const { fn, attempts } = flaky(1, 'ok');
      let settled = false;

      const result = retry(fn, { retries: 2, baseMs: 100 });
      result.then(() => {
        settled = true;
      });

      await jest.advanceTimersByTimeAsync(99);
      expect(attempts).toEqual([0]);
      expect(settled).toBe(false);

      await jest.advanceTimersByTimeAsync(1);
      expect(attempts).toEqual([0, 1]);
      await expect(result).resolves.toBe('ok');
      expect(settled).toBe(true);
    });

    it('follows the exponential schedule across multiple retries', async () => {
      const { fn, attempts } = flaky(2, 'ok');

      const result = retry(fn, { retries: 3, baseMs: 100 });

      await jest.advanceTimersByTimeAsync(100); // first retry fires
      expect(attempts).toEqual([0, 1]);

      await jest.advanceTimersByTimeAsync(199); // second retry needs 200ms
      expect(attempts).toEqual([0, 1]);

      await jest.advanceTimersByTimeAsync(1);
      expect(attempts).toEqual([0, 1, 2]);
      await expect(result).resolves.toBe('ok');
    });
  });
});
