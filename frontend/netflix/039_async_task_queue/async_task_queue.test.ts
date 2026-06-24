import { runQueue } from './async_task_queue';

describe('runQueue', () => {
  it('returns results in order', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.resolve(2),
      () => Promise.resolve(3),
    ];
    expect(await runQueue(tasks, { concurrency: 2, retries: 0 })).toEqual([
      1, 2, 3,
    ]);
  });

  it('retries a flaky task', async () => {
    let attempts = 0;
    const flaky = () => {
      attempts++;
      return attempts < 3
        ? Promise.reject(new Error('flaky'))
        : Promise.resolve('ok');
    };
    const result = await runQueue([flaky], { concurrency: 1, retries: 3 });
    expect(result).toEqual(['ok']);
    expect(attempts).toBe(3);
  });

  it('rejects when retries are exhausted', async () => {
    const always = () => Promise.reject(new Error('nope'));
    await expect(
      runQueue([always], { concurrency: 1, retries: 1 }),
    ).rejects.toThrow('nope');
  });

  it('resolves to an empty array for no tasks', async () => {
    expect(await runQueue([], { concurrency: 4, retries: 2 })).toEqual([]);
  });

  it('runs a failing task exactly once when retries is 0', async () => {
    let attempts = 0;
    const failing = () => {
      attempts++;
      return Promise.reject(new Error('boom'));
    };
    await expect(
      runQueue([failing], { concurrency: 1, retries: 0 }),
    ).rejects.toThrow('boom');
    expect(attempts).toBe(1);
  });

  it('preserves input order when tasks settle out of order', async () => {
    const delay = (ms: number, value: number) => () =>
      new Promise<number>((resolve) => setTimeout(() => resolve(value), ms));
    const tasks = [delay(30, 1), delay(0, 2), delay(15, 3)];
    expect(await runQueue(tasks, { concurrency: 3, retries: 0 })).toEqual([
      1, 2, 3,
    ]);
  });

  it('never exceeds the concurrency limit', async () => {
    let active = 0;
    let maxActive = 0;
    const makeTask = () => () => {
      active++;
      maxActive = Math.max(maxActive, active);
      return new Promise<number>((resolve) =>
        setTimeout(() => {
          active--;
          resolve(active);
        }, 10),
      );
    };
    const tasks = Array.from({ length: 6 }, makeTask);
    await runQueue(tasks, { concurrency: 2, retries: 0 });
    expect(maxActive).toBe(2);
  });

  it('runs sequentially when concurrency is 1', async () => {
    let active = 0;
    let maxActive = 0;
    const makeTask = (value: number) => () => {
      active++;
      maxActive = Math.max(maxActive, active);
      return new Promise<number>((resolve) =>
        setTimeout(() => {
          active--;
          resolve(value);
        }, 5),
      );
    };
    const tasks = [makeTask(1), makeTask(2), makeTask(3)];
    expect(await runQueue(tasks, { concurrency: 1, retries: 0 })).toEqual([
      1, 2, 3,
    ]);
    expect(maxActive).toBe(1);
  });

  it('processes all tasks when there are more tasks than concurrency', async () => {
    const tasks = Array.from(
      { length: 10 },
      (_, i) => () => Promise.resolve(i),
    );
    expect(await runQueue(tasks, { concurrency: 3, retries: 0 })).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('retries each task independently', async () => {
    const attempts = [0, 0];
    const makeFlaky = (idx: number, value: string) => () => {
      attempts[idx]++;
      return attempts[idx] < 2
        ? Promise.reject(new Error('retry'))
        : Promise.resolve(value);
    };
    const tasks = [makeFlaky(0, 'a'), makeFlaky(1, 'b')];
    expect(await runQueue(tasks, { concurrency: 2, retries: 1 })).toEqual([
      'a',
      'b',
    ]);
    expect(attempts).toEqual([2, 2]);
  });

  it('succeeds on the final allowed attempt', async () => {
    let attempts = 0;
    const flaky = () => {
      attempts++;
      // retries: 2 => 3 total attempts allowed; succeed on the 3rd.
      return attempts < 3
        ? Promise.reject(new Error('flaky'))
        : Promise.resolve('done');
    };
    expect(await runQueue([flaky], { concurrency: 1, retries: 2 })).toEqual([
      'done',
    ]);
    expect(attempts).toBe(3);
  });
});
