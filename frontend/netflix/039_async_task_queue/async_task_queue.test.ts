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
});
