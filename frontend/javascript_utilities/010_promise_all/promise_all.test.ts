import { promiseAll } from './promise_all';

describe('promiseAll', () => {
  test('should resolve when all promises resolve', async () => {
    const result = await promiseAll([
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3),
    ]);
    expect(result).toEqual([1, 2, 3]);
  });

  test('should reject when one promise rejects', async () => {
    await expect(
      promiseAll([
        Promise.resolve(1),
        Promise.reject('error'),
        Promise.resolve(3),
      ]),
    ).rejects.toBe('error');
  });

  test('should resolve with empty array for empty input', async () => {
    const result = await promiseAll([]);
    expect(result).toEqual([]);
  });

  test('should handle non-promise values', async () => {
    const result = await promiseAll([1, 2, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  test('should preserve order', async () => {
    const result = await promiseAll([
      new Promise((resolve) => setTimeout(() => resolve('slow'), 100)),
      Promise.resolve('fast'),
      new Promise((resolve) => setTimeout(() => resolve('medium'), 50)),
    ]);
    expect(result).toEqual(['slow', 'fast', 'medium']);
  });

  test('should reject with first rejection reason', async () => {
    await expect(
      promiseAll([Promise.reject('first'), Promise.reject('second')]),
    ).rejects.toBe('first');
  });
});
