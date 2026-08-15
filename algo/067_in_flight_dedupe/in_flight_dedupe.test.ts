import { dedupe } from './in_flight_dedupe';

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

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('dedupe', () => {
  describe('happy path', () => {
    it('invokes the underlying function and resolves with its value', async () => {
      const { fn, deferreds } = makeFetcher();
      const load = dedupe(fn);
      const p = load('u1');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('u1');
      deferreds[0].resolve('alice');
      await expect(p).resolves.toBe('alice');
    });

    it('shares one invocation across concurrent calls with the same key', async () => {
      const { fn, deferreds } = makeFetcher();
      const load = dedupe(fn);
      const p1 = load('u1');
      const p2 = load('u1');
      const p3 = load('u1');
      expect(fn).toHaveBeenCalledTimes(1);
      deferreds[0].resolve('alice');
      await expect(Promise.all([p1, p2, p3])).resolves.toEqual([
        'alice',
        'alice',
        'alice',
      ]);
    });

    it('does not share invocations across different keys', async () => {
      const { fn, deferreds, calls } = makeFetcher();
      const load = dedupe(fn);
      const p1 = load('u1');
      const p2 = load('u2');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(calls).toEqual(['u1', 'u2']);
      deferreds[0].resolve('alice');
      deferreds[1].resolve('bob');
      await expect(p1).resolves.toBe('alice');
      await expect(p2).resolves.toBe('bob');
    });
  });

  describe('entry clears on settle', () => {
    it('re-invokes the function for a call made after the previous one resolved', async () => {
      const { fn, deferreds } = makeFetcher();
      const load = dedupe(fn);
      const p1 = load('u1');
      deferreds[0].resolve('v1');
      await expect(p1).resolves.toBe('v1');
      await flush();

      const p2 = load('u1');
      expect(fn).toHaveBeenCalledTimes(2);
      deferreds[1].resolve('v2');
      await expect(p2).resolves.toBe('v2');
    });

    it('serves fresh data on the second round, not the settled result', async () => {
      const { fn, deferreds } = makeFetcher();
      const load = dedupe(fn);
      const p1 = load('cfg');
      deferreds[0].resolve('stale');
      await p1;
      await flush();

      const p2 = load('cfg');
      deferreds[1].resolve('fresh');
      await expect(p2).resolves.toBe('fresh');
    });

    it('a call made while a second fetch is in flight joins the second fetch', async () => {
      const { fn, deferreds } = makeFetcher();
      const load = dedupe(fn);
      const p1 = load('u1');
      deferreds[0].resolve('first');
      await p1;
      await flush();

      const p2 = load('u1');
      const p3 = load('u1');
      expect(fn).toHaveBeenCalledTimes(2);
      deferreds[1].resolve('second');
      await expect(p2).resolves.toBe('second');
      await expect(p3).resolves.toBe('second');
    });
  });

  describe('rejection paths', () => {
    it('shares a rejection with every concurrent caller', async () => {
      const { fn, deferreds } = makeFetcher();
      const load = dedupe(fn);
      const boom = new Error('backend down');
      const p1 = load('u1');
      const p2 = load('u1');
      expect(fn).toHaveBeenCalledTimes(1);
      deferreds[0].reject(boom);
      await expect(p1).rejects.toBe(boom);
      await expect(p2).rejects.toBe(boom);
    });

    it('clears the entry on rejection so the next call retries', async () => {
      const { fn, deferreds } = makeFetcher();
      const load = dedupe(fn);
      const p1 = load('u1');
      deferreds[0].reject(new Error('transient'));
      await expect(p1).rejects.toThrow('transient');
      await flush();

      const p2 = load('u1');
      expect(fn).toHaveBeenCalledTimes(2);
      deferreds[1].resolve('recovered');
      await expect(p2).resolves.toBe('recovered');
    });

    it('a failure for one key does not affect an in-flight fetch for another key', async () => {
      const { fn, deferreds } = makeFetcher();
      const load = dedupe(fn);
      const p1 = load('bad');
      const p2 = load('good');
      deferreds[0].reject(new Error('nope'));
      await expect(p1).rejects.toThrow('nope');
      deferreds[1].resolve('fine');
      await expect(p2).resolves.toBe('fine');
    });
  });

  describe('in-flight guarantee', () => {
    it('never has more than one invocation in flight per key', async () => {
      const { fn, deferreds } = makeFetcher();
      const load = dedupe(fn);
      const round1 = [load('k'), load('k'), load('k')];
      expect(fn).toHaveBeenCalledTimes(1);
      deferreds[0].resolve('r1');
      await Promise.all(round1);
      await flush();

      const round2 = [load('k'), load('k')];
      expect(fn).toHaveBeenCalledTimes(2);
      deferreds[1].resolve('r2');
      await expect(Promise.all(round2)).resolves.toEqual(['r2', 'r2']);
    });
  });
});
