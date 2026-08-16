import { paginate, take, FetchPage, Page } from './paginated_fetcher';

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Auto-resolving fetcher: page i has cursor `p${i}`; records every call. */
function autoFetcher(pageItems: number[][]): {
  fetchPage: FetchPage<number>;
  calls: Array<string | null>;
} {
  const calls: Array<string | null> = [];
  const fetchPage: FetchPage<number> = (cursor) => {
    calls.push(cursor);
    const index = cursor === null ? 0 : Number(cursor.slice(1));
    const items = pageItems[index] ?? [];
    const nextCursor = index + 1 < pageItems.length ? `p${index + 1}` : null;
    return Promise.resolve({ items, nextCursor });
  };
  return { fetchPage, calls };
}

/** Manually-controlled fetcher: the i-th call resolves/rejects on demand. */
function deferredFetcher(): {
  fetchPage: FetchPage<number>;
  calls: Array<string | null>;
  resolve: (call: number, page: Page<number>) => void;
  reject: (call: number, reason?: unknown) => void;
} {
  const calls: Array<string | null> = [];
  const resolvers: Array<(page: Page<number>) => void> = [];
  const rejecters: Array<(reason?: unknown) => void> = [];
  const fetchPage: FetchPage<number> = (cursor) => {
    calls.push(cursor);
    return new Promise<Page<number>>((res, rej) => {
      resolvers.push(res);
      rejecters.push(rej);
    });
  };
  return {
    fetchPage,
    calls,
    resolve: (call, page) => resolvers[call](page),
    reject: (call, reason) => rejecters[call](reason),
  };
}

describe('paginate', () => {
  it('is lazy: no fetch happens until the first next()', async () => {
    const f = deferredFetcher();
    const gen = paginate(f.fetchPage);

    await tick();
    expect(f.calls).toEqual([]);

    const first = gen.next();
    expect(f.calls).toEqual([null]);

    f.resolve(0, { items: [1], nextCursor: null });
    await expect(first).resolves.toEqual({ value: 1, done: false });
  });

  it('yields all items across pages in order', async () => {
    const f = autoFetcher([[1, 2], [3], [4, 5]]);
    const seen: number[] = [];

    for await (const item of paginate(f.fetchPage)) {
      seen.push(item);
    }

    expect(seen).toEqual([1, 2, 3, 4, 5]);
    expect(f.calls).toEqual([null, 'p1', 'p2']);
  });

  it('completes immediately on an empty first page with a null cursor', async () => {
    const f = autoFetcher([[]]);
    const seen: number[] = [];

    for await (const item of paginate(f.fetchPage)) {
      seen.push(item);
    }

    expect(seen).toEqual([]);
    expect(f.calls).toEqual([null]);
  });

  it('handles an empty last page', async () => {
    const f = autoFetcher([[1, 2], []]);
    const seen: number[] = [];

    for await (const item of paginate(f.fetchPage)) {
      seen.push(item);
    }

    expect(seen).toEqual([1, 2]);
    expect(f.calls).toEqual([null, 'p1']);
  });

  describe('prefetch', () => {
    it('starts fetching page 2 as soon as page 1 arrives, before its items are consumed', async () => {
      const f = deferredFetcher();
      const gen = paginate(f.fetchPage);

      const first = gen.next();
      f.resolve(0, { items: [1, 2], nextCursor: 'c2' });

      await expect(first).resolves.toEqual({ value: 1, done: false });
      // page 1 still has an unconsumed item, yet page 2 is already in flight
      expect(f.calls).toEqual([null, 'c2']);
    });

    it('does not prefetch when the current page is the last one', async () => {
      const f = deferredFetcher();
      const gen = paginate(f.fetchPage);

      const first = gen.next();
      f.resolve(0, { items: [1], nextCursor: null });
      await first;
      await tick();

      expect(f.calls).toEqual([null]);
    });

    it('consumes the prefetched page without re-fetching it', async () => {
      const f = deferredFetcher();
      const gen = paginate(f.fetchPage);

      const first = gen.next();
      f.resolve(0, { items: [1], nextCursor: 'c2' });
      await expect(first).resolves.toEqual({ value: 1, done: false });

      const second = gen.next();
      f.resolve(1, { items: [2], nextCursor: null });
      await expect(second).resolves.toEqual({ value: 2, done: false });
      await expect(gen.next()).resolves.toMatchObject({ done: true });

      expect(f.calls).toEqual([null, 'c2']);
    });
  });

  describe('stopping early', () => {
    it('issues no fetch beyond the in-flight prefetch after return()', async () => {
      const f = deferredFetcher();
      const gen = paginate(f.fetchPage);

      const first = gen.next();
      f.resolve(0, { items: [1, 2], nextCursor: 'c2' });
      await first;
      expect(f.calls).toEqual([null, 'c2']);

      await gen.return();

      // the in-flight prefetch resolving must not trigger a page-3 fetch
      f.resolve(1, { items: [3, 4], nextCursor: 'c3' });
      await tick();
      expect(f.calls).toEqual([null, 'c2']);
    });

    it('breaking out of for-await stops all further fetching', async () => {
      const f = autoFetcher([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);

      for await (const item of paginate(f.fetchPage)) {
        if (item === 1) break;
      }
      await tick();
      await tick();

      expect(f.calls).toEqual([null, 'p1']); // page 3 never requested
    });
  });

  describe('errors', () => {
    it('propagates a first-page fetch error to the consumer', async () => {
      const f = deferredFetcher();
      const gen = paginate(f.fetchPage);
      const error = new Error('page 1 failed');

      const first = gen.next();
      f.reject(0, error);

      await expect(first).rejects.toBe(error);
    });

    it('propagates a prefetch error when the consumer reaches that page', async () => {
      const f = deferredFetcher();
      const gen = paginate(f.fetchPage);
      const error = new Error('page 2 failed');

      const first = gen.next();
      f.resolve(0, { items: [1], nextCursor: 'c2' });
      await expect(first).resolves.toEqual({ value: 1, done: false });

      const second = gen.next();
      f.reject(1, error);
      await expect(second).rejects.toBe(error);
    });
  });
});

describe('take', () => {
  it('collects the first n items', async () => {
    const f = autoFetcher([
      [1, 2],
      [3, 4],
    ]);
    await expect(take(paginate(f.fetchPage), 3)).resolves.toEqual([1, 2, 3]);
  });

  it('stops mid-page and closes the iterator — no fetch past the prefetch', async () => {
    const f = autoFetcher([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);

    await expect(take(paginate(f.fetchPage), 2)).resolves.toEqual([1, 2]);
    await tick();
    await tick();

    // page 1 fetched, page 2 prefetched while page 1 was consumed — never page 3
    expect(f.calls).toEqual([null, 'p1']);
  });

  it('returns fewer items when the stream ends early', async () => {
    const f = autoFetcher([[1], [2]]);
    await expect(take(paginate(f.fetchPage), 10)).resolves.toEqual([1, 2]);
  });

  it('take(source, 0) resolves [] without pulling anything', async () => {
    const f = deferredFetcher();

    await expect(take(paginate(f.fetchPage), 0)).resolves.toEqual([]);
    await tick();
    expect(f.calls).toEqual([]);
  });

  it('works with any async iterable, not just paginate', async () => {
    async function* naturals(): AsyncGenerator<number, void, undefined> {
      let i = 1;
      while (true) {
        yield i;
        i += 1;
      }
    }

    await expect(take(naturals(), 4)).resolves.toEqual([1, 2, 3, 4]);
  });
});
