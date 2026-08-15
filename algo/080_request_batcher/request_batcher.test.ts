import { createBatcher, BatchFn } from './request_batcher';

function recordingBatchFn(): {
  batchFn: BatchFn<string, string>;
  calls: string[][];
} {
  const calls: string[][] = [];
  const batchFn: BatchFn<string, string> = (keys) => {
    calls.push([...keys]);
    return Promise.resolve(new Map(keys.map((k) => [k, k.toUpperCase()])));
  };
  return { batchFn, calls };
}

describe('createBatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('timer-driven flush', () => {
    it('collects calls and flushes once after maxWaitMs', async () => {
      const { batchFn, calls } = recordingBatchFn();
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 100 });

      const a = load('a');
      const b = load('b');
      expect(calls).toEqual([]); // nothing flushed yet

      await jest.advanceTimersByTimeAsync(9);
      expect(calls).toEqual([]);

      await jest.advanceTimersByTimeAsync(1);
      expect(calls).toEqual([['a', 'b']]);

      await expect(a).resolves.toBe('A');
      await expect(b).resolves.toBe('B');
    });

    it('passes keys in first-call order', async () => {
      const { batchFn, calls } = recordingBatchFn();
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 100 });

      const promises = [load('c'), load('a'), load('b')];
      await jest.advanceTimersByTimeAsync(10);

      expect(calls).toEqual([['c', 'a', 'b']]);
      await expect(Promise.all(promises)).resolves.toEqual(['C', 'A', 'B']);
    });

    it('opens a fresh batch (and fresh timer) after a flush', async () => {
      const { batchFn, calls } = recordingBatchFn();
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 100 });

      const a = load('a');
      await jest.advanceTimersByTimeAsync(10);
      expect(calls).toEqual([['a']]);

      const b = load('b');
      await jest.advanceTimersByTimeAsync(9);
      expect(calls).toEqual([['a']]); // second batch has its own full timer

      await jest.advanceTimersByTimeAsync(1);
      expect(calls).toEqual([['a'], ['b']]);
      await expect(a).resolves.toBe('A');
      await expect(b).resolves.toBe('B');
    });
  });

  describe('size-driven flush', () => {
    it('flushes immediately at maxSize without waiting for the timer', async () => {
      const { batchFn, calls } = recordingBatchFn();
      const load = createBatcher(batchFn, { maxWaitMs: 10_000, maxSize: 2 });

      const a = load('a');
      const b = load('b');

      await jest.advanceTimersByTimeAsync(0); // flush microtasks only — no timer time
      expect(calls).toEqual([['a', 'b']]);
      await expect(a).resolves.toBe('A');
      await expect(b).resolves.toBe('B');
    });

    it('cancels the timer after a size flush — no duplicate flush later', async () => {
      const { batchFn, calls } = recordingBatchFn();
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 2 });

      void load('a');
      void load('b');
      await jest.advanceTimersByTimeAsync(0);
      expect(calls).toEqual([['a', 'b']]);

      await jest.advanceTimersByTimeAsync(100);
      expect(calls).toEqual([['a', 'b']]); // timer did not fire a second flush
    });

    it('an overflowing call lands in the next batch', async () => {
      const { batchFn, calls } = recordingBatchFn();
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 2 });

      const a = load('a');
      const b = load('b'); // size flush here
      const c = load('c'); // new batch
      await jest.advanceTimersByTimeAsync(0);
      expect(calls).toEqual([['a', 'b']]);

      await jest.advanceTimersByTimeAsync(10);
      expect(calls).toEqual([['a', 'b'], ['c']]);
      await expect(Promise.all([a, b, c])).resolves.toEqual(['A', 'B', 'C']);
    });
  });

  describe('duplicate keys', () => {
    it('deduplicates keys within a batch and shares the result', async () => {
      const { batchFn, calls } = recordingBatchFn();
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 100 });

      const first = load('a');
      const second = load('a');
      const other = load('b');
      await jest.advanceTimersByTimeAsync(10);

      expect(calls).toEqual([['a', 'b']]); // 'a' appears once
      await expect(first).resolves.toBe('A');
      await expect(second).resolves.toBe('A');
      await expect(other).resolves.toBe('B');
    });

    it('duplicates count once toward maxSize', async () => {
      const { batchFn, calls } = recordingBatchFn();
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 2 });

      void load('a');
      void load('a'); // still 1 unique key — must NOT trigger a size flush
      await jest.advanceTimersByTimeAsync(0);
      expect(calls).toEqual([]);

      void load('b'); // now 2 unique keys — size flush
      await jest.advanceTimersByTimeAsync(0);
      expect(calls).toEqual([['a', 'b']]);
    });
  });

  describe('error handling', () => {
    it('rejects every caller of a batch when batchFn rejects', async () => {
      const error = new Error('bulk endpoint down');
      const batchFn: BatchFn<string, string> = () => Promise.reject(error);
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 100 });

      const a = load('a').catch((e: unknown) => e);
      const b = load('b').catch((e: unknown) => e);
      await jest.advanceTimersByTimeAsync(10);

      expect(await a).toBe(error);
      expect(await b).toBe(error);
    });

    it('a failing batch does not affect the next batch', async () => {
      let shouldFail = true;
      const error = new Error('transient');
      const batchFn: BatchFn<string, string> = (keys) => {
        if (shouldFail) {
          shouldFail = false;
          return Promise.reject(error);
        }
        return Promise.resolve(new Map(keys.map((k) => [k, k.toUpperCase()])));
      };
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 100 });

      const failing = load('a').catch((e: unknown) => e);
      await jest.advanceTimersByTimeAsync(10);
      expect(await failing).toBe(error);

      const ok = load('b');
      await jest.advanceTimersByTimeAsync(10);
      await expect(ok).resolves.toBe('B');
    });

    it('rejects only the caller whose key is missing from the result map', async () => {
      const batchFn: BatchFn<string, string> = (keys) =>
        Promise.resolve(new Map(keys.filter((k) => k !== 'ghost').map((k) => [k, k.toUpperCase()])));
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 100 });

      const present = load('a');
      const missing = load('ghost').catch((e: unknown) => e);
      await jest.advanceTimersByTimeAsync(10);

      await expect(present).resolves.toBe('A');
      const caught = await missing;
      expect(caught).toBeInstanceOf(Error);
      expect((caught as Error).message).toContain('ghost');
    });
  });

  describe('in-flight isolation', () => {
    it('calls made while a batch is in flight join a new batch', async () => {
      const calls: string[][] = [];
      let releaseFirst!: (map: Map<string, string>) => void;
      const batchFn: BatchFn<string, string> = (keys) => {
        calls.push([...keys]);
        if (calls.length === 1) {
          return new Promise((resolve) => {
            releaseFirst = resolve;
          });
        }
        return Promise.resolve(new Map(keys.map((k) => [k, k.toUpperCase()])));
      };
      const load = createBatcher(batchFn, { maxWaitMs: 10, maxSize: 100 });

      const a = load('a');
      await jest.advanceTimersByTimeAsync(10); // first batch flushed, still pending
      expect(calls).toEqual([['a']]);

      const b = load('b'); // must join a NEW batch, not the in-flight one
      await jest.advanceTimersByTimeAsync(10);
      expect(calls).toEqual([['a'], ['b']]);

      releaseFirst(new Map([['a', 'A']]));
      await expect(a).resolves.toBe('A');
      await expect(b).resolves.toBe('B');
    });
  });
});
