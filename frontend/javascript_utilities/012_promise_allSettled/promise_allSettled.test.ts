import { promiseAllSettled } from './promise_allSettled';

describe('promiseAllSettled', () => {
  test('should handle all fulfilled', async () => {
    const result = await promiseAllSettled([
      Promise.resolve(1),
      Promise.resolve(2),
    ]);
    expect(result).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'fulfilled', value: 2 },
    ]);
  });

  test('should handle all rejected', async () => {
    const result = await promiseAllSettled([
      Promise.reject('a'),
      Promise.reject('b'),
    ]);
    expect(result).toEqual([
      { status: 'rejected', reason: 'a' },
      { status: 'rejected', reason: 'b' },
    ]);
  });

  test('should handle mixed fulfilled and rejected', async () => {
    const result = await promiseAllSettled([
      Promise.resolve(1),
      Promise.reject('err'),
      Promise.resolve(3),
    ]);
    expect(result).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'rejected', reason: 'err' },
      { status: 'fulfilled', value: 3 },
    ]);
  });

  test('should resolve with empty array for empty input', async () => {
    const result = await promiseAllSettled([]);
    expect(result).toEqual([]);
  });

  test('should handle non-promise values', async () => {
    const result = await promiseAllSettled([1, 2, 3]);
    expect(result).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'fulfilled', value: 2 },
      { status: 'fulfilled', value: 3 },
    ]);
  });

  test('should preserve order', async () => {
    const result = await promiseAllSettled([
      new Promise((resolve) => setTimeout(() => resolve('slow'), 100)),
      Promise.reject('fast'),
      Promise.resolve('instant'),
    ]);
    expect(result).toEqual([
      { status: 'fulfilled', value: 'slow' },
      { status: 'rejected', reason: 'fast' },
      { status: 'fulfilled', value: 'instant' },
    ]);
  });
});
