import { chunk, unzip, zip } from './chunkZip';

describe('chunk', () => {
  test('should split into groups with a shorter last group', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk(['a', 'b', 'c', 'd'], 2)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  test('should wrap every element when size is 1', () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  test('should return a single group when size exceeds length', () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  test('should return an empty array for empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  test('should throw RangeError for size below 1 or non-integer size', () => {
    expect(() => chunk([1], 0)).toThrow(RangeError);
    expect(() => chunk([1], -2)).toThrow(RangeError);
    expect(() => chunk([1], 1.5)).toThrow(RangeError);
    expect(() => chunk([1], NaN)).toThrow(RangeError);
  });

  test('should not mutate the input and should return new arrays', () => {
    const input = [1, 2, 3];
    const result = chunk(input, 2);

    expect(input).toEqual([1, 2, 3]);
    expect(result[0]).not.toBe(input);
    result[0].push(99);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe('zip', () => {
  test('should pair elements of two arrays by index', () => {
    expect(zip(['a', 'b', 'c'], [1, 2, 3])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
  });

  test('should zip three arrays into triples', () => {
    expect(zip([1, 2], ['x', 'y'], [true, false])).toEqual([
      [1, 'x', true],
      [2, 'y', false],
    ]);
  });

  test('should truncate to the shortest array', () => {
    expect(zip([1, 2, 3], ['a'])).toEqual([[1, 'a']]);
    expect(zip([1, 2, 3], ['a', 'b'], [])).toEqual([]);
  });

  test('should return an empty array when given no arrays', () => {
    expect(zip()).toEqual([]);
  });
});

describe('unzip', () => {
  test('should split tuples into per-position arrays', () => {
    expect(
      unzip([
        ['a', 1],
        ['b', 2],
      ]),
    ).toEqual([
      ['a', 'b'],
      [1, 2],
    ]);
  });

  test('should round-trip with zip', () => {
    const names = ['Dark', 'Ozark', 'Arrival'];
    const years = [2017, 2017, 2016];
    const ratings = [8.7, 8.5, 7.9];

    expect(unzip(zip(names, years, ratings))).toEqual([names, years, ratings]);
    expect(unzip([])).toEqual([]);
  });
});
