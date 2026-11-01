import {
  createLogger,
  getRequestId,
  LogEntry,
  runWithContext,
} from './request_context';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const microtask = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('runWithContext / getRequestId', () => {
  it('exposes the id inside the context and undefined outside', async () => {
    expect(getRequestId()).toBeUndefined();
    await runWithContext('req-1', async () => {
      expect(getRequestId()).toBe('req-1');
    });
    expect(getRequestId()).toBeUndefined();
  });

  it('passes the resolved value through', async () => {
    await expect(runWithContext('req-1', async () => 'payload')).resolves.toBe(
      'payload',
    );
  });

  it('passes rejections through unchanged', async () => {
    const boom = new Error('delivery failed');
    await expect(
      runWithContext('req-1', async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);
  });

  it('supports synchronous fns too', async () => {
    await expect(runWithContext('req-s', () => getRequestId())).resolves.toBe(
      'req-s',
    );
  });

  it('survives awaits, timers, and microtasks', async () => {
    const seen: (string | undefined)[] = [];
    await runWithContext('req-hops', async () => {
      seen.push(getRequestId()); // sync
      await microtask();
      seen.push(getRequestId()); // after queueMicrotask
      await sleep(1);
      seen.push(getRequestId()); // after setTimeout
      await Promise.resolve().then(() => seen.push(getRequestId())); // inside .then
    });
    expect(seen).toEqual(['req-hops', 'req-hops', 'req-hops', 'req-hops']);
  });

  it('survives nested calls that know nothing about the context', async () => {
    async function deepThirdPartyIsh(): Promise<string | undefined> {
      await sleep(1);
      return getRequestId();
    }
    await expect(
      runWithContext('req-deep', () => deepThirdPartyIsh()),
    ).resolves.toBe('req-deep');
  });

  it('two interleaved contexts never bleed into each other', async () => {
    const observed: Record<string, (string | undefined)[]> = { a: [], b: [] };

    const run = (key: 'a' | 'b', id: string, delays: number[]) =>
      runWithContext(id, async () => {
        for (const ms of delays) {
          observed[key].push(getRequestId());
          await sleep(ms);
        }
        observed[key].push(getRequestId());
      });

    // interleave: a and b yield back and forth on different cadences
    await Promise.all([
      run('a', 'req-A', [1, 3, 1]),
      run('b', 'req-B', [2, 1, 2]),
    ]);

    expect(observed.a).toEqual(['req-A', 'req-A', 'req-A', 'req-A']);
    expect(observed.b).toEqual(['req-B', 'req-B', 'req-B', 'req-B']);
  });

  it('nested contexts shadow and restore', async () => {
    const seen: (string | undefined)[] = [];
    await runWithContext('outer', async () => {
      seen.push(getRequestId());
      await runWithContext('inner', async () => {
        seen.push(getRequestId());
        await sleep(1);
        seen.push(getRequestId());
      });
      seen.push(getRequestId());
    });
    expect(seen).toEqual(['outer', 'inner', 'inner', 'outer']);
  });
});

describe('createLogger', () => {
  it('stamps entries with the ambient request id at call time', async () => {
    const entries: LogEntry[] = [];
    const logger = createLogger((entry) => entries.push(entry));

    logger.info('outside any request');
    await runWithContext('req-9', async () => {
      logger.info('starting delivery');
      await sleep(1);
      logger.error('delivery failed');
    });

    expect(entries).toEqual([
      { requestId: undefined, level: 'info', message: 'outside any request' },
      { requestId: 'req-9', level: 'info', message: 'starting delivery' },
      { requestId: 'req-9', level: 'error', message: 'delivery failed' },
    ]);
  });

  it('one shared logger instance serves interleaved requests correctly', async () => {
    const entries: LogEntry[] = [];
    const logger = createLogger((entry) => entries.push(entry));

    await Promise.all([
      runWithContext('req-A', async () => {
        logger.info('A step 1');
        await sleep(2);
        logger.info('A step 2');
      }),
      runWithContext('req-B', async () => {
        logger.info('B step 1');
        await sleep(1);
        logger.info('B step 2');
      }),
    ]);

    const byId = (id: string) =>
      entries.filter((e) => e.requestId === id).map((e) => e.message);
    expect(byId('req-A')).toEqual(['A step 1', 'A step 2']);
    expect(byId('req-B')).toEqual(['B step 1', 'B step 2']);
    expect(entries).toHaveLength(4);
  });

  it('a logger created inside a context does NOT freeze that context', async () => {
    const entries: LogEntry[] = [];
    let logger!: ReturnType<typeof createLogger>;
    await runWithContext('creation-ctx', async () => {
      logger = createLogger((entry) => entries.push(entry));
    });
    await runWithContext('call-ctx', async () => logger.info('hello'));
    expect(entries).toEqual([
      { requestId: 'call-ctx', level: 'info', message: 'hello' },
    ]);
  });
});
