import {
  objectKeys,
  objectValues,
  objectEntries,
} from './objectKeysValuesEntries';

describe('objectKeys', () => {
  test('should return keys of a basic object', () => {
    expect(objectKeys({ a: 1, b: 2, c: 3 })).toEqual(['a', 'b', 'c']);
  });

  test('should return empty array for empty object', () => {
    expect(objectKeys({})).toEqual([]);
  });

  test('should not include inherited properties', () => {
    const parent = { inherited: true };
    const child = Object.create(parent);
    child.own = true;
    expect(objectKeys(child)).toEqual(['own']);
  });

  test('should exclude symbol keys', () => {
    const sym = Symbol('test');
    const obj = { a: 1, [sym]: 2 };
    expect(objectKeys(obj)).toEqual(['a']);
  });

  test('should return numeric keys as strings', () => {
    const obj = { 1: 'a', 2: 'b', 3: 'c' };
    expect(objectKeys(obj)).toEqual(['1', '2', '3']);
  });
});

describe('objectValues', () => {
  test('should return values of a basic object', () => {
    expect(objectValues({ a: 1, b: 2, c: 3 })).toEqual([1, 2, 3]);
  });

  test('should return empty array for empty object', () => {
    expect(objectValues({})).toEqual([]);
  });

  test('should not include inherited property values', () => {
    const parent = { inherited: 'parent' };
    const child = Object.create(parent);
    child.own = 'child';
    expect(objectValues(child)).toEqual(['child']);
  });

  test('should exclude symbol key values', () => {
    const sym = Symbol('test');
    const obj = { a: 1, [sym]: 2 };
    expect(objectValues(obj)).toEqual([1]);
  });

  test('should return values for numeric keys', () => {
    const obj = { 1: 'a', 2: 'b' };
    expect(objectValues(obj)).toEqual(['a', 'b']);
  });
});

describe('objectEntries', () => {
  test('should return entries of a basic object', () => {
    expect(objectEntries({ a: 1, b: 2 })).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  test('should return empty array for empty object', () => {
    expect(objectEntries({})).toEqual([]);
  });

  test('should not include inherited properties', () => {
    const parent = { inherited: true };
    const child = Object.create(parent);
    child.own = true;
    expect(objectEntries(child)).toEqual([['own', true]]);
  });

  test('should exclude symbol keys', () => {
    const sym = Symbol('test');
    const obj = { a: 1, [sym]: 2 };
    expect(objectEntries(obj)).toEqual([['a', 1]]);
  });

  test('should return numeric keys as strings in entries', () => {
    const obj = { 1: 'a', 2: 'b' };
    expect(objectEntries(obj)).toEqual([
      ['1', 'a'],
      ['2', 'b'],
    ]);
  });
});
