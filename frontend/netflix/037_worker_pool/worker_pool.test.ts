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
      runPool(2, [() => Promise.resolve(1), () => Promise.reject(new Error('x'))]),
    ).rejects.toThrow('x');
  });
});
