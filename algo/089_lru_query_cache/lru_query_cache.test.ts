import { createLruCache } from './lru_query_cache';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('createLruCache — basics', () => {
  it('stores and retrieves values', () => {
    const cache = createLruCache<string, number>({ max: 3 });
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('zzz')).toBeUndefined();
    expect(cache.size).toBe(2);
  });

  it('updates an existing key in place without growing', () => {
    const cache = createLruCache<string, number>({ max: 2 });
    cache.set('a', 1);
    cache.set('a', 10);
    expect(cache.get('a')).toBe(10);
    expect(cache.size).toBe(1);
  });

  it('has / delete report presence correctly', () => {
    const cache = createLruCache<string, number>({ max: 2 });
    cache.set('a', 1);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.delete('a')).toBe(true);
    expect(cache.delete('a')).toBe(false);
    expect(cache.has('a')).toBe(false);
    expect(cache.size).toBe(0);
  });

  it('accepts object keys', () => {
    const cache = createLruCache<object, string>({ max: 2 });
    const k1 = { id: 1 };
    const k2 = { id: 1 };
    cache.set(k1, 'one');
    expect(cache.get(k1)).toBe('one');
    expect(cache.get(k2)).toBeUndefined();
  });

  it('throws RangeError when max < 1', () => {
    expect(() => createLruCache({ max: 0 })).toThrow(RangeError);
    expect(() => createLruCache({ max: -5 })).toThrow(RangeError);
  });
});

describe('createLruCache — eviction and recency', () => {
  it('evicts the least-recently-used entry when inserting past max', () => {
    const cache = createLruCache<string, number>({ max: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.has('a')).toBe(false);
    expect(cache.has('b')).toBe(true);
    expect(cache.has('c')).toBe(true);
    expect(cache.size).toBe(2);
  });

  it('get refreshes recency', () => {
    const cache = createLruCache<string, number>({ max: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a');
    cache.set('c', 3);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('a')).toBe(true);
  });

  it('set on an existing key refreshes recency and never evicts', () => {
    const cache = createLruCache<string, number>({ max: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 11);
    expect(cache.size).toBe(2);
    cache.set('c', 3);
    expect(cache.has('b')).toBe(false);
    expect(cache.get('a')).toBe(11);
  });

  it('has does not refresh recency', () => {
    const cache = createLruCache<string, number>({ max: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.has('a');
    cache.set('c', 3);
    expect(cache.has('a')).toBe(false);
  });

  it('max of 1 keeps only the latest key', () => {
    const cache = createLruCache<string, number>({ max: 1 });
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.size).toBe(1);
  });

  it('performs 100k mixed operations quickly (O(1) per op)', () => {
    const max = 1_000;
    const cache = createLruCache<number, number>({ max });
    const startedAt = Date.now();
    for (let i = 0; i < 100_000; i++) {
      cache.set(i, i * 2);
      if (i % 3 === 0) cache.get(i - 500);
      if (i % 7 === 0) cache.has(i - 200);
    }
    expect(Date.now() - startedAt).toBeLessThan(1000);
    expect(cache.size).toBe(max);
    expect(cache.get(99_999)).toBe(199_998);
    expect(cache.has(0)).toBe(false);
  });
});

describe('createLruCache — ttl', () => {
  it('returns values before expiry and misses at/after expiry', () => {
    let t = 0;
    const cache = createLruCache<string, string>({
      max: 5,
      ttlMs: 1000,
      now: () => t,
    });
    cache.set('a', 'x');
    t = 999;
    expect(cache.get('a')).toBe('x');
    t = 1000;
    expect(cache.get('a')).toBeUndefined();
  });

  it('has() evicts an expired entry and reduces size', () => {
    let t = 0;
    const cache = createLruCache<string, string>({
      max: 5,
      ttlMs: 100,
      now: () => t,
    });
    cache.set('a', 'x');
    cache.set('b', 'y');
    expect(cache.size).toBe(2);
    t = 150;
    expect(cache.has('a')).toBe(false);
    expect(cache.size).toBe(1);
    expect(cache.has('b')).toBe(false);
    expect(cache.size).toBe(0);
  });

  it('set resets the expiry clock for that key', () => {
    let t = 0;
    const cache = createLruCache<string, string>({
      max: 5,
      ttlMs: 100,
      now: () => t,
    });
    cache.set('a', 'x');
    t = 80;
    cache.set('a', 'y');
    t = 150;
    expect(cache.get('a')).toBe('y');
    t = 180;
    expect(cache.get('a')).toBeUndefined();
  });

  it('never expires without ttlMs', () => {
    let t = 0;
    const cache = createLruCache<string, string>({ max: 5, now: () => t });
    cache.set('a', 'x');
    t = Number.MAX_SAFE_INTEGER;
    expect(cache.get('a')).toBe('x');
  });
});

describe('createLruCache — getOrLoad', () => {
  it('returns the cached value without calling the loader', async () => {
    const cache = createLruCache<string, number>({ max: 5 });
    cache.set('a', 1);
    const loader = jest.fn(async () => 99);
    await expect(cache.getOrLoad('a', loader)).resolves.toBe(1);
    expect(loader).not.toHaveBeenCalled();
  });

  it('loads, caches, and returns the value on a miss', async () => {
    const cache = createLruCache<string, number>({ max: 5 });
    const loader = jest.fn(async () => 42);
    await expect(cache.getOrLoad('a', loader)).resolves.toBe(42);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(cache.get('a')).toBe(42);
    await cache.getOrLoad('a', loader);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent loads for the same key', async () => {
    const cache = createLruCache<string, number>({ max: 5 });
    let resolve!: (v: number) => void;
    const loader = jest.fn(() => new Promise<number>((r) => (resolve = r)));

    const p1 = cache.getOrLoad('a', loader);
    const p2 = cache.getOrLoad('a', loader);
    const p3 = cache.getOrLoad('a', loader);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(cache.has('a')).toBe(false); // nothing cached while pending

    resolve(7);
    await expect(Promise.all([p1, p2, p3])).resolves.toEqual([7, 7, 7]);
    expect(cache.get('a')).toBe(7);
  });

  it('does not dedupe across different keys', async () => {
    const cache = createLruCache<string, string>({ max: 5 });
    const loader = jest.fn(async () => 'v');
    await Promise.all([
      cache.getOrLoad('a', loader),
      cache.getOrLoad('b', loader),
    ]);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failed load and retries on the next call', async () => {
    const cache = createLruCache<string, number>({ max: 5 });
    const loader = jest
      .fn<Promise<number>, []>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(5);

    await expect(cache.getOrLoad('a', loader)).rejects.toThrow('boom');
    expect(cache.has('a')).toBe(false);
    await expect(cache.getOrLoad('a', loader)).resolves.toBe(5);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('propagates one failure to every concurrent waiter, then clears in-flight', async () => {
    const cache = createLruCache<string, number>({ max: 5 });
    let reject!: (e: unknown) => void;
    const loader = jest.fn(() => new Promise<number>((_, rj) => (reject = rj)));

    const p1 = cache.getOrLoad('a', loader);
    const p2 = cache.getOrLoad('a', loader);
    reject(new Error('down'));
    await expect(p1).rejects.toThrow('down');
    await expect(p2).rejects.toThrow('down');
    await flush();

    const ok = jest.fn(async () => 1);
    await expect(cache.getOrLoad('a', ok)).resolves.toBe(1);
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it('treats a synchronously throwing loader as a rejection', async () => {
    const cache = createLruCache<string, number>({ max: 5 });
    const loader = () => {
      throw new Error('sync');
    };
    await expect(cache.getOrLoad('a', loader)).rejects.toThrow('sync');
    expect(cache.has('a')).toBe(false);
  });

  it('reloads after the cached value expires', async () => {
    let t = 0;
    const cache = createLruCache<string, number>({
      max: 5,
      ttlMs: 100,
      now: () => t,
    });
    const loader = jest.fn(async () => 1);
    await cache.getOrLoad('a', loader);
    t = 50;
    await cache.getOrLoad('a', loader);
    expect(loader).toHaveBeenCalledTimes(1);
    t = 100;
    await cache.getOrLoad('a', loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
