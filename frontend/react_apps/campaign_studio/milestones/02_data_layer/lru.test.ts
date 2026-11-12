import { createLruCache } from './lru';
import { deferred, flush } from '../../shell/testing';

describe('02 — createLruCache', () => {
  it('evicts the least recently used entry; get() refreshes recency; keys() is LRU→MRU', () => {
    const cache = createLruCache<string, number>({ max: 3 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.keys()).toEqual(['a', 'b', 'c']);

    expect(cache.get('a')).toBe(1); // a becomes MRU
    cache.set('d', 4); // evicts b
    expect(cache.has('b')).toBe(false);
    expect(cache.keys()).toEqual(['c', 'a', 'd']);
    expect(cache.size).toBe(3);

    cache.set('c', 30); // replace keeps size, moves c to MRU
    expect(cache.get('c')).toBe(30);
    expect(cache.keys()).toEqual(['a', 'd', 'c']);
    expect(cache.size).toBe(3);

    expect(cache.delete('a')).toBe(true);
    expect(cache.delete('zzz')).toBe(false);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('d')).toBeUndefined();
  });

  it('honours ttlMs with an injectable clock: expired entries are missing, not counted and not in keys()', () => {
    let t = 1_000;
    const cache = createLruCache<string, string>({
      max: 10,
      ttlMs: 100,
      now: () => t,
    });
    cache.set('x', 'X');
    t = 1_099;
    expect(cache.get('x')).toBe('X');
    expect(cache.has('x')).toBe(true);
    t = 1_100; // exactly ttl later → expired
    expect(cache.has('x')).toBe(false);
    expect(cache.get('x')).toBeUndefined();
    expect(cache.size).toBe(0);
    expect(cache.keys()).toEqual([]);

    cache.set('x', 'X2'); // re-set restarts the clock
    t = 1_150;
    expect(cache.get('x')).toBe('X2');
  });

  it('getOrLoad shares one in-flight load per key, caches a success and never caches a failure', async () => {
    const cache = createLruCache<string, number>({ max: 5 });
    const d = deferred<number>();
    const loader = jest.fn(() => d.promise);

    const p1 = cache.getOrLoad('k', loader);
    const p2 = cache.getOrLoad('k', loader);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledWith('k');
    expect(cache.has('k')).toBe(false); // nothing cached until it resolves

    d.resolve(7);
    await expect(p1).resolves.toBe(7);
    await expect(p2).resolves.toBe(7);
    expect(cache.get('k')).toBe(7);

    const loader2 = jest.fn(async () => 99);
    await expect(cache.getOrLoad('k', loader2)).resolves.toBe(7);
    expect(loader2).not.toHaveBeenCalled();

    // a rejected load is not cached, rejects every waiter, and the next call retries
    const failing = deferred<number>();
    const f1 = cache.getOrLoad('bad', () => failing.promise);
    const f2 = cache.getOrLoad('bad', () => failing.promise);
    f1.catch(() => {});
    f2.catch(() => {});
    failing.reject(new Error('boom'));
    await expect(f1).rejects.toThrow('boom');
    await expect(f2).rejects.toThrow('boom');
    await flush();
    expect(cache.has('bad')).toBe(false);

    const ok = jest.fn(async () => 1);
    await expect(cache.getOrLoad('bad', ok)).resolves.toBe(1);
    expect(ok).toHaveBeenCalledTimes(1);
    expect(cache.get('bad')).toBe(1);
  });
});
