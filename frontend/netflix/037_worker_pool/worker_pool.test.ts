import { runPool } from './worker_pool';

describe('runPool', () => {
  it('returns results in input order', async () => {
    const jobs = [
      () => new Promise<number>((r) => setTimeout(() => r(1), 30)),
      () => new Promise<number>((r) => setTimeout(() => r(2), 10)),
      () => new Promise<number>((r) => setTimeout(() => r(3), 20)),
    ];
    expect(await runPool(2, jobs)).toEqual([1, 2, 3]);
  });

  it('respects the pool size', async () => {
    let running = 0;
    let max = 0;
    const mk = () => () =>
      new Promise<void>((resolve) => {
        running++;
        max = Math.max(max, running);
        setTimeout(() => {
          running--;
          resolve();
        }, 20);
      });
    await runPool(2, [mk(), mk(), mk(), mk()]);
    expect(max).toBeLessThanOrEqual(2);
  });

  it('rejects when a job fails', async () => {
    await expect(
      runPool(2, [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('x')),
      ]),
    ).rejects.toThrow('x');
  });

  it('resolves to an empty array for no jobs', async () => {
    expect(await runPool(3, [])).toEqual([]);
  });

  it('runs every job exactly once', async () => {
    const fns = Array.from({ length: 5 }, (_, i) =>
      jest.fn(() => Promise.resolve(i)),
    );
    await runPool(2, fns);
    fns.forEach((fn) => expect(fn).toHaveBeenCalledTimes(1));
  });

  it('handles a pool size larger than the number of jobs', async () => {
    const jobs = [() => Promise.resolve('a'), () => Promise.resolve('b')];
    expect(await runPool(10, jobs)).toEqual(['a', 'b']);
  });

  it('runs jobs strictly sequentially when size is 1', async () => {
    let running = 0;
    let maxRunning = 0;
    const order: number[] = [];
    const mk = (value: number) => () =>
      new Promise<number>((resolve) => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        setTimeout(() => {
          running--;
          order.push(value);
          resolve(value);
        }, 5);
      });
    const result = await runPool(1, [mk(1), mk(2), mk(3)]);
    expect(result).toEqual([1, 2, 3]);
    expect(order).toEqual([1, 2, 3]);
    expect(maxRunning).toBe(1);
  });

  it('never exceeds the pool size across many jobs', async () => {
    let running = 0;
    let maxRunning = 0;
    const mk = () => () =>
      new Promise<void>((resolve) => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        setTimeout(() => {
          running--;
          resolve();
        }, 10);
      });
    const jobs = Array.from({ length: 9 }, mk);
    await runPool(3, jobs);
    expect(maxRunning).toBe(3);
  });

  it('starts the next queued job as soon as a slot frees up', async () => {
    const started: number[] = [];
    const mk = (value: number, delay: number) => () => {
      started.push(value);
      return new Promise<number>((resolve) =>
        setTimeout(() => resolve(value), delay),
      );
    };
    // With size 1, job 2 must not start until job 1 (fast) has finished.
    await runPool(1, [mk(1, 5), mk(2, 5), mk(3, 5)]);
    expect(started).toEqual([1, 2, 3]);
  });

  it('preserves order for a single job', async () => {
    expect(await runPool(4, [() => Promise.resolve(42)])).toEqual([42]);
  });

  it('rejects with the first failing job even if other jobs would succeed later', async () => {
    const order: string[] = [];
    const jobs = [
      () =>
        new Promise<string>((resolve) =>
          setTimeout(() => {
            order.push('slow-ok');
            resolve('ok');
          }, 20),
        ),
      () =>
        new Promise<string>((_, reject) =>
          setTimeout(() => {
            order.push('fast-fail');
            reject(new Error('boom'));
          }, 5),
        ),
    ];
    await expect(runPool(2, jobs)).rejects.toThrow('boom');
  });
});
