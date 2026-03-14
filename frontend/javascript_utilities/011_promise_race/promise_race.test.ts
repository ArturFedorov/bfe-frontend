import { promiseRace } from './promise_race';

describe('promiseRace', () => {
  test('should resolve with first resolved value', async () => {
    const result = await promiseRace([
      new Promise((resolve) => setTimeout(() => resolve('slow'), 100)),
      Promise.resolve('fast'),
    ]);
    expect(result).toBe('fast');
  });

  test('should reject with first rejected reason', async () => {
    await expect(
      promiseRace([
        new Promise((_, reject) => setTimeout(() => reject('slow'), 100)),
        Promise.reject('fast'),
      ]),
    ).rejects.toBe('fast');
  });

  test('should handle mixed resolve and reject', async () => {
    const result = await promiseRace([
      new Promise((_, reject) => setTimeout(() => reject('error'), 100)),
      Promise.resolve('ok'),
    ]);
    expect(result).toBe('ok');
  });

  test('should handle single promise', async () => {
    const result = await promiseRace([Promise.resolve(42)]);
    expect(result).toBe(42);
  });

  test('should handle non-promise values', async () => {
    const result = await promiseRace([42, Promise.resolve(100)]);
    expect(result).toBe(42);
  });
});
