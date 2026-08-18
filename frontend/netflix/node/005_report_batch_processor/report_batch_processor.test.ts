import { JobResult, processBatch } from './report_batch_processor';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('processBatch', () => {
  it('processes every job and returns results in input order', async () => {
    const results = await processBatch(
      [1, 2, 3, 4, 5],
      async (n) => n * 10,
      { concurrency: 2 },
    );
    expect(results).toEqual([
      { status: 'fulfilled', value: 10 },
      { status: 'fulfilled', value: 20 },
      { status: 'fulfilled', value: 30 },
      { status: 'fulfilled', value: 40 },
      { status: 'fulfilled', value: 50 },
    ]);
  });

  it('passes the job index to the worker', async () => {
    const seen: [string, number][] = [];
    await processBatch(
      ['a', 'b', 'c'],
      async (job, index) => {
        seen.push([job, index]);
      },
      { concurrency: 3 },
    );
    expect(seen.sort()).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
  });

  it('never exceeds the concurrency limit and reuses freed slots immediately', async () => {
    const gates = Array.from({ length: 6 }, () => deferred<void>());
    let inFlight = 0;
    let maxInFlight = 0;
    const started: number[] = [];

    const batch = processBatch(
      [0, 1, 2, 3, 4, 5],
      async (job) => {
        started.push(job);
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await gates[job].promise;
        inFlight -= 1;
        return job;
      },
      { concurrency: 2 },
    );

    await flush();
    expect(started).toEqual([0, 1]); // only two started, rest queued

    gates[1].resolve();
    await flush();
    expect(started).toEqual([0, 1, 2]); // freed slot picked up job 2 immediately

    gates[0].resolve();
    gates[2].resolve();
    await flush();
    expect(started).toEqual([0, 1, 2, 3, 4]);

    gates[3].resolve();
    gates[4].resolve();
    gates[5].resolve();
    const results = await batch;

    expect(maxInFlight).toBe(2);
    expect(results.map((r) => r.status)).toEqual(Array(6).fill('fulfilled'));
  });

  it('returns results in input order even when jobs finish out of order', async () => {
    const slow = deferred<string>();
    const batch = processBatch(
      ['slow', 'fast'],
      (job) => (job === 'slow' ? slow.promise : Promise.resolve('fast-done')),
      { concurrency: 2 },
    );
    await flush();
    slow.resolve('slow-done');
    const results = await batch;
    expect(results).toEqual([
      { status: 'fulfilled', value: 'slow-done' },
      { status: 'fulfilled', value: 'fast-done' },
    ]);
  });

  it('isolates per-job failures — other jobs still run and the batch resolves', async () => {
    const boom = new Error('malformed partner record');
    const results = await processBatch(
      [1, 2, 3, 4],
      async (n) => {
        if (n === 2) throw boom;
        return n;
      },
      { concurrency: 2 },
    );
    expect(results).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'rejected', reason: boom },
      { status: 'fulfilled', value: 3 },
      { status: 'fulfilled', value: 4 },
    ]);
  });

  it('a failing job frees its slot for queued work', async () => {
    const order: string[] = [];
    const results = await processBatch(
      ['a', 'b', 'c'],
      async (job) => {
        order.push(job);
        if (job === 'a') throw new Error('a failed');
        return job;
      },
      { concurrency: 1 },
    );
    expect(order).toEqual(['a', 'b', 'c']);
    expect(results[0].status).toBe('rejected');
    expect(results.slice(1)).toEqual([
      { status: 'fulfilled', value: 'b' },
      { status: 'fulfilled', value: 'c' },
    ]);
  });

  it('handles synchronous worker throws like rejections', async () => {
    const results = await processBatch(
      [1],
      (): Promise<number> => {
        throw new Error('sync boom');
      },
      { concurrency: 1 },
    );
    expect(results[0].status).toBe('rejected');
  });

  it('concurrency above the job count just runs everything', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const results = await processBatch(
      [1, 2, 3],
      async (n) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await flush();
        inFlight -= 1;
        return n;
      },
      { concurrency: 100 },
    );
    expect(maxInFlight).toBe(3);
    expect(results).toHaveLength(3);
  });

  it('resolves [] for an empty batch without calling the worker', async () => {
    const worker = jest.fn(async () => 'never');
    await expect(processBatch([], worker, { concurrency: 4 })).resolves.toEqual([]);
    expect(worker).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, NaN, Infinity])('throws RangeError for concurrency = %p', (bad) => {
    expect(() => processBatch([1], async (n) => n, { concurrency: bad })).toThrow(RangeError);
  });

  it('scales: 10k jobs at concurrency 50, results all in order', async () => {
    const jobs = Array.from({ length: 10_000 }, (_, i) => i);
    const results = await processBatch(jobs, async (n) => n * 2, { concurrency: 50 });
    expect(results).toHaveLength(10_000);
    expect(results.every((r, i) => r.status === 'fulfilled' && r.value === i * 2)).toBe(true);
  });
});

// type-level check: JobResult narrows on status
const _narrow = (r: JobResult<number>): number | unknown =>
  r.status === 'fulfilled' ? r.value : r.reason;
void _narrow;
