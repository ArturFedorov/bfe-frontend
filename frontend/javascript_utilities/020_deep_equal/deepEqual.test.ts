import { deepEqual } from './deepEqual';

describe('deepEqual', () => {
  test('should compare primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
  });

  test('should compare plain objects', () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  test('should compare nested objects', () => {
    expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(
      true,
    );
    expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toBe(
      false,
    );
  });

  test('should compare arrays', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
  });

  test('should return false for different types', () => {
    expect(deepEqual(1, '1')).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual([], {})).toBe(false);
  });

  test('should treat NaN as equal to NaN', () => {
    expect(deepEqual(NaN, NaN)).toBe(true);
  });

  test('should distinguish +0 and -0', () => {
    expect(deepEqual(+0, -0)).toBe(false);
  });

  test('should handle null and undefined', () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  test('should compare Date objects', () => {
    expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-01'))).toBe(
      true,
    );
    expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-02'))).toBe(
      false,
    );
  });

  test('should compare RegExp objects', () => {
    expect(deepEqual(/test/gi, /test/gi)).toBe(true);
    expect(deepEqual(/test/g, /test/i)).toBe(false);
  });

  test('should handle objects with different number of keys', () => {
    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });
});
