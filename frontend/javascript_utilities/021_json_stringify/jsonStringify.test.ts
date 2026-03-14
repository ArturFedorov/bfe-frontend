import { jsonStringify } from './jsonStringify';

describe('jsonStringify', () => {
  test('should stringify a string', () => {
    expect(jsonStringify('hello')).toBe('"hello"');
  });

  test('should stringify a number', () => {
    expect(jsonStringify(42)).toBe('42');
    expect(jsonStringify(-3.14)).toBe('-3.14');
  });

  test('should stringify a boolean', () => {
    expect(jsonStringify(true)).toBe('true');
    expect(jsonStringify(false)).toBe('false');
  });

  test('should stringify null', () => {
    expect(jsonStringify(null)).toBe('null');
  });

  test('should stringify an array', () => {
    expect(jsonStringify([1, 2, 3])).toBe('[1,2,3]');
    expect(jsonStringify(['a', 'b'])).toBe('["a","b"]');
  });

  test('should stringify an object', () => {
    expect(jsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  test('should stringify nested structures', () => {
    expect(jsonStringify({ a: [1, { b: 2 }] })).toBe('{"a":[1,{"b":2}]}');
  });

  test('should return undefined for undefined', () => {
    expect(jsonStringify(undefined)).toBeUndefined();
  });

  test('should return undefined for functions', () => {
    expect(jsonStringify(() => {})).toBeUndefined();
  });

  test('should convert NaN and Infinity to null', () => {
    expect(jsonStringify(NaN)).toBe('null');
    expect(jsonStringify(Infinity)).toBe('null');
    expect(jsonStringify(-Infinity)).toBe('null');
  });

  test('should handle empty object and array', () => {
    expect(jsonStringify({})).toBe('{}');
    expect(jsonStringify([])).toBe('[]');
  });

  test('should omit undefined values in objects', () => {
    expect(jsonStringify({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});
