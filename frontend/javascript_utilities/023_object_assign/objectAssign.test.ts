import { objectAssign } from './objectAssign';

describe('objectAssign', () => {
  test('should merge two objects', () => {
    const target = { a: 1 };
    const result = objectAssign(target, { b: 2 });

    expect(result).toEqual({ a: 1, b: 2 });
  });

  test('should merge multiple sources', () => {
    const result = objectAssign({}, { a: 1 }, { b: 2 }, { c: 3 });

    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  test('should overwrite properties from later sources', () => {
    const result = objectAssign({}, { a: 1, b: 2 }, { b: 3, c: 4 });

    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  test('should not deep merge nested objects', () => {
    const nested = { x: 1 };
    const result = objectAssign({}, { a: nested });

    expect(result.a).toBe(nested);
  });

  test('should return the target object', () => {
    const target = { a: 1 };
    const result = objectAssign(target, { b: 2 });

    expect(result).toBe(target);
  });

  test('should handle empty sources', () => {
    const target = { a: 1 };
    const result = objectAssign(target);

    expect(result).toEqual({ a: 1 });
    expect(result).toBe(target);
  });

  test('should copy string-keyed properties', () => {
    const result = objectAssign({}, { a: 1, b: 'two', c: true });

    expect(result).toEqual({ a: 1, b: 'two', c: true });
  });

  test('should skip null and undefined sources', () => {
    const result = objectAssign({}, null, { a: 1 }, undefined, { b: 2 });

    expect(result).toEqual({ a: 1, b: 2 });
  });
});
