import { staleWhileRevalidate } from './stale_while_revalidate';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** A fetcher whose every invocation is a manually-settled deferred. */
function makeFetcher() {
  const deferreds: Deferred<string>[] = [];
  const calls: string[] = [];
  const fn = jest.fn((key: string): Promise<string> => {
    calls.push(key);
    const d = deferred<string>();
    deferreds.push(d);
    return d.promise;
  });
  return { fn, deferreds, calls };
}

describe('staleWhileRevalidate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /** Flushes microtasks (and any zero-delay timers the impl may schedule). */
  const flush = async () => {
    await jest.advanceTimersByTimeAsync(0);
  };

  describe('cold cache (first call)', () => {
    it('awaits the fetcher and resolves with its value', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const p = get('flags');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('flags');

      let settled = false;
      p.then(() => {
        settled = true;
      });
      await flush();
      expect(settled).toBe(false); // cold call waits for the fetch

      deferreds[0].resolve('v1');
      await expect(p).resolves.toBe('v1');
    });

    it('shares one fetch between concurrent cold calls', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const p1 = get('flags');
      const p2 = get('flags');
      expect(fn).toHaveBeenCalledTimes(1);

      deferreds[0].resolve('v1');
      await expect(Promise.all([p1, p2])).resolves.toEqual(['v1', 'v1']);
    });

    it('propagates a cold-cache rejection and caches nothing', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const p1 = get('flags');
      deferreds[0].reject(new Error('network down'));
      await expect(p1).rejects.toThrow('network down');
      await flush();

      // next call is cold again: it awaits a brand new fetch
      const p2 = get('flags');
      expect(fn).toHaveBeenCalledTimes(2);
      deferreds[1].resolve('v1');
      await expect(p2).resolves.toBe('v1');
    });
  });

  describe('warm cache (stale hit)', () => {
    it('returns the cached value immediately, without awaiting the refresh', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const p1 = get('flags');
      deferreds[0].resolve('v1');
      await p1;
      await flush();

      const p2 = get('flags');
      // resolves to the stale value even though the refresh is still pending
      await expect(p2).resolves.toBe('v1');
      expect(deferreds).toHaveLength(2); // refresh was started…
      // …and its deferred is still unresolved
    });

    it('triggers exactly one background refresh per stale hit round', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const p1 = get('flags');
      deferreds[0].resolve('v1');
      await p1;
      await flush();

      await get('flags');
      expect(fn).toHaveBeenCalledTimes(2); // initial + one refresh
    });

    it('serves the refreshed value once the refresh lands', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const p1 = get('flags');
      deferreds[0].resolve('v1');
      await p1;
      await flush();

      await expect(get('flags')).resolves.toBe('v1'); // starts refresh
      deferreds[1].resolve('v2');
      await flush();

      await expect(get('flags')).resolves.toBe('v2');
    });

    it('dedupes concurrent stale hits into a single refresh', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const p1 = get('flags');
      deferreds[0].resolve('v1');
      await p1;
      await flush();

      const hits = [get('flags'), get('flags'), get('flags')];
      await expect(Promise.all(hits)).resolves.toEqual(['v1', 'v1', 'v1']);
      // 1 initial fetch + 1 shared refresh, not 4 calls
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('allows a new refresh after the previous one settles', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const p1 = get('flags');
      deferreds[0].resolve('v1');
      await p1;
      await flush();

      await get('flags'); // refresh #1 starts
      deferreds[1].resolve('v2');
      await flush();

      await expect(get('flags')).resolves.toBe('v2'); // refresh #2 starts
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('refresh failures', () => {
    it('keeps the old value when a background refresh rejects', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const p1 = get('flags');
      deferreds[0].resolve('v1');
      await p1;
      await flush();

      await expect(get('flags')).resolves.toBe('v1'); // starts refresh
      deferreds[1].reject(new Error('refresh failed'));
      await flush();

      // cache is intact; the stale value is still served
      await expect(get('flags')).resolves.toBe('v1');
    });

    it('retries with a fresh refresh after a failed one', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const p1 = get('flags');
      deferreds[0].resolve('v1');
      await p1;
      await flush();

      await get('flags'); // refresh #1
      deferreds[1].reject(new Error('flaky'));
      await flush();

      await expect(get('flags')).resolves.toBe('v1'); // refresh #2 starts
      expect(fn).toHaveBeenCalledTimes(3);
      deferreds[2].resolve('v2');
      await flush();

      await expect(get('flags')).resolves.toBe('v2');
    });
  });

  describe('key independence', () => {
    it('fetches and caches per key', async () => {
      const { fn, deferreds, calls } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const pa = get('a');
      const pb = get('b');
      expect(calls).toEqual(['a', 'b']);
      deferreds[0].resolve('va');
      deferreds[1].resolve('vb');
      await expect(pa).resolves.toBe('va');
      await expect(pb).resolves.toBe('vb');
      await flush();

      await expect(get('a')).resolves.toBe('va');
      await expect(get('b')).resolves.toBe('vb');
    });

    it('a refresh failure for one key does not touch another key', async () => {
      const { fn, deferreds } = makeFetcher();
      const get = staleWhileRevalidate(fn);

      const pa = get('a');
      const pb = get('b');
      deferreds[0].resolve('va');
      deferreds[1].resolve('vb');
      await Promise.all([pa, pb]);
      await flush();

      await get('a'); // refresh for 'a' (deferreds[2])
      deferreds[2].reject(new Error('a is flaky'));
      await flush();

      await expect(get('b')).resolves.toBe('vb');
      await expect(get('a')).resolves.toBe('va');
    });
  });
});
