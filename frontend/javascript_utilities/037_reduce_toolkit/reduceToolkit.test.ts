import { readFileSync } from 'fs';
import { countBy, filter, flatMap, keyBy, map } from './reduceToolkit';

describe('reduce toolkit', () => {
  describe('map', () => {
    test('should transform every element and pass the index', () => {
      expect(map([1, 2, 3], (n, i) => n * 10 + i)).toEqual([10, 21, 32]);
    });

    test('should keep array results nested and keep undefined results', () => {
      expect(map([1, 2], (n) => [n])).toEqual([[1], [2]]);
      expect(map([1, 2], () => undefined)).toEqual([undefined, undefined]);
      expect(map([1, 2], () => undefined)).toHaveLength(2);
    });

    test('should return an empty array for empty input', () => {
      expect(map([], (n: number) => n)).toEqual([]);
    });
  });

  describe('filter', () => {
    test('should keep matching elements without mutating the input', () => {
      const input = [1, 2, 3, 4, 5];

      expect(filter(input, (n) => n % 2 === 1)).toEqual([1, 3, 5]);
      expect(input).toEqual([1, 2, 3, 4, 5]);
    });

    test('should keep falsy elements when the predicate says so', () => {
      expect(filter([0, '', null, 1], (v) => v !== 1)).toEqual([0, '', null]);
    });
  });

  describe('flatMap', () => {
    test('should flatten exactly one level', () => {
      expect(flatMap([1, 2], (n) => [n, n * 10])).toEqual([1, 10, 2, 20]);
      expect(flatMap([1, 2], (n) => [[n]])).toEqual([[1], [2]]);
    });

    test('should wrap non-array results and drop empty arrays', () => {
      expect(flatMap([1, 2, 3], (n) => (n === 2 ? [] : n))).toEqual([1, 3]);
    });
  });

  describe('countBy', () => {
    test('should count occurrences per key', () => {
      expect(countBy(['apple', 'avocado', 'banana'], (s) => s[0])).toEqual({
        a: 2,
        b: 1,
      });
    });

    test('should coerce numeric keys to strings and start each key at 1', () => {
      expect(countBy([1.2, 1.9, 2.1], Math.floor)).toEqual({ '1': 2, '2': 1 });
    });
  });

  describe('keyBy', () => {
    test('should index items by key with last one winning on duplicates', () => {
      const items = [
        { id: 'x', v: 1 },
        { id: 'y', v: 2 },
        { id: 'x', v: 3 },
      ];

      expect(keyBy(items, (o) => o.id)).toEqual({
        x: { id: 'x', v: 3 },
        y: { id: 'y', v: 2 },
      });
    });

    test('should return an empty object for empty input', () => {
      expect(keyBy([], () => 'k')).toEqual({});
    });
  });

  test('should be built on reduce only (static source check)', () => {
    const source = readFileSync(require.resolve('./reduceToolkit'), 'utf8');

    expect(source).toContain('.reduce(');
    expect(source).not.toContain('.map(');
    expect(source).not.toContain('.filter(');
    expect(source).not.toContain('.flatMap(');
    expect(source).not.toContain('for (');
    expect(source).not.toContain('for(');
    expect(source).not.toContain('while');
  });
});
