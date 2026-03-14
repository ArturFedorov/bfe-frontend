import { jsonParse } from './jsonParse';

describe('jsonParse', () => {
  test('should parse a string', () => {
    expect(jsonParse('"hello"')).toBe('hello');
  });

  test('should parse a number', () => {
    expect(jsonParse('42')).toBe(42);
    expect(jsonParse('-3.14')).toBeCloseTo(-3.14);
  });

  test('should parse booleans', () => {
    expect(jsonParse('true')).toBe(true);
    expect(jsonParse('false')).toBe(false);
  });

  test('should parse null', () => {
    expect(jsonParse('null')).toBeNull();
  });

  test('should parse an array', () => {
    expect(jsonParse('[1,2,3]')).toEqual([1, 2, 3]);
  });

  test('should parse an object', () => {
    expect(jsonParse('{"a":1,"b":"two"}')).toEqual({ a: 1, b: 'two' });
  });

  test('should parse nested structures', () => {
    expect(jsonParse('{"a":[1,{"b":2}]}')).toEqual({ a: [1, { b: 2 }] });
  });

  test('should handle whitespace', () => {
    expect(jsonParse('  { "a" : 1 , "b" : [ 2 , 3 ] }  ')).toEqual({
      a: 1,
      b: [2, 3],
    });
  });

  test('should handle escaped characters in strings', () => {
    expect(jsonParse('"hello\\nworld"')).toBe('hello\nworld');
    expect(jsonParse('"a\\tb"')).toBe('a\tb');
    expect(jsonParse('"a\\\\"')).toBe('a\\');
  });

  test('should throw on invalid JSON', () => {
    expect(() => jsonParse('{invalid}')).toThrow();
    expect(() => jsonParse('')).toThrow();
    expect(() => jsonParse('undefined')).toThrow();
  });

  test('should parse empty object and array', () => {
    expect(jsonParse('{}')).toEqual({});
    expect(jsonParse('[]')).toEqual([]);
  });
});
