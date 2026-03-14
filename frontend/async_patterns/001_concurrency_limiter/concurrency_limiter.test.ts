import { asyncPool } from './concurrency_limiter';

describe('asyncPool', () => {
  it('should respect the concurrency limit', async () => {
    let running = 0;
    let maxRunning = 0;

    const createTask = (val: number, delay: number) => () =>
      new Promise<number>((resolve) => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        setTimeout(() => {
          running--;
          resolve(val);
        }, delay);
      });

    const tasks = [
      createTask(1, 100),
      createTask(2, 50),
      createTask(3, 80),
      createTask(4, 30),
      createTask(5, 60),
    ];

    await asyncPool(2, tasks);
    expect(maxRunning).toBeLessThanOrEqual(2);
  });

  it('should return all results in order', async () => {
    const tasks = [
      () => new Promise<number>((r) => setTimeout(() => r(1), 50)),
      () => new Promise<number>((r) => setTimeout(() => r(2), 10)),
      () => new Promise<number>((r) => setTimeout(() => r(3), 30)),
    ];

    const results = await asyncPool(2, tasks);
    expect(results).toEqual([1, 2, 3]);
  });

  it('should handle rejection', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error('fail')),
      () => Promise.resolve(3),
    ];

    await expect(asyncPool(2, tasks)).rejects.toThrow('fail');
  });

  it('should handle empty tasks array', async () => {
    const results = await asyncPool(3, []);
    expect(results).toEqual([]);
  });

  it('should handle limit greater than tasks length', async () => {
    const tasks = [() => Promise.resolve(1), () => Promise.resolve(2)];

    const results = await asyncPool(10, tasks);
    expect(results).toEqual([1, 2]);
  });

  it('should run sequentially with limit of 1', async () => {
    const order: number[] = [];

    const createTask = (val: number, delay: number) => () =>
      new Promise<number>((resolve) => {
        order.push(val);
        setTimeout(() => resolve(val), delay);
      });

    const tasks = [createTask(1, 50), createTask(2, 10), createTask(3, 30)];

    const results = await asyncPool(1, tasks);
    expect(results).toEqual([1, 2, 3]);
    expect(order).toEqual([1, 2, 3]);
  });
});
