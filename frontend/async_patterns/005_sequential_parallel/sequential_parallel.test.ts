import { sequential, parallel } from './sequential_parallel';

describe('sequential', () => {
  it('should run tasks in order', async () => {
    const order: number[] = [];

    const tasks = [1, 2, 3].map(
      (n) => () =>
        new Promise<number>((resolve) => {
          order.push(n);
          setTimeout(() => resolve(n), 10);
        }),
    );

    await sequential(tasks);
    expect(order).toEqual([1, 2, 3]);
  });

  it('should return correct results in order', async () => {
    const tasks = [
      () => Promise.resolve('a'),
      () => Promise.resolve('b'),
      () => Promise.resolve('c'),
    ];

    const results = await sequential(tasks);
    expect(results).toEqual(['a', 'b', 'c']);
  });

  it('should handle empty array', async () => {
    const results = await sequential([]);
    expect(results).toEqual([]);
  });

  it('should reject if any task rejects', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error('fail')),
      () => Promise.resolve(3),
    ];

    await expect(sequential(tasks)).rejects.toThrow('fail');
  });
});

describe('parallel', () => {
  it('should run tasks concurrently', async () => {
    let running = 0;
    let maxRunning = 0;

    const tasks = [50, 30, 40].map(
      (delay) => () =>
        new Promise<number>((resolve) => {
          running++;
          maxRunning = Math.max(maxRunning, running);
          setTimeout(() => {
            running--;
            resolve(delay);
          }, delay);
        }),
    );

    await parallel(tasks);
    expect(maxRunning).toBe(3);
  });

  it('should return correct results in order', async () => {
    const tasks = [
      () => new Promise<number>((r) => setTimeout(() => r(1), 50)),
      () => new Promise<number>((r) => setTimeout(() => r(2), 10)),
      () => new Promise<number>((r) => setTimeout(() => r(3), 30)),
    ];

    const results = await parallel(tasks);
    expect(results).toEqual([1, 2, 3]);
  });

  it('should handle empty array', async () => {
    const results = await parallel([]);
    expect(results).toEqual([]);
  });

  it('should reject if any task rejects', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error('fail')),
      () => Promise.resolve(3),
    ];

    await expect(parallel(tasks)).rejects.toThrow('fail');
  });
});
