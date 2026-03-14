import { memoize } from './memoize';

describe('memoize', () => {
  test('should cache the result for the same arguments', () => {
    const fn = jest.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should return different results for different arguments', () => {
    const fn = jest.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(3)).toBe(6);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('should support a custom key function', () => {
    const fn = jest.fn((obj: { id: number; name: string }) =>
      obj.name.toUpperCase(),
    );
    const memoized = memoize(fn, (obj) => String(obj.id));

    expect(memoized({ id: 1, name: 'alice' })).toBe('ALICE');
    expect(memoized({ id: 1, name: 'bob' })).toBe('ALICE');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should work with single argument', () => {
    const fn = jest.fn((s: string) => s.length);
    const memoized = memoize(fn);

    expect(memoized('hello')).toBe(5);
    expect(memoized('hello')).toBe(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should use default key for multiple arguments', () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);

    expect(memoized(2, 1)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('should recompute on cache miss', () => {
    const fn = jest.fn((x: number) => x + 1);
    const memoized = memoize(fn);

    expect(memoized(1)).toBe(2);
    expect(memoized(2)).toBe(3);
    expect(memoized(1)).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
