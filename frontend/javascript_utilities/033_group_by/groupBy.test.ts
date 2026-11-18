import { groupBy } from './groupBy';

describe('groupBy', () => {
  test('should group by the result of a function', () => {
    expect(groupBy([6.1, 4.2, 6.3], Math.floor)).toEqual({
      '6': [6.1, 6.3],
      '4': [4.2],
    });
  });

  test('should group by a property name', () => {
    const shows = [
      { title: 'Dark', genre: 'sci-fi' },
      { title: 'Ozark', genre: 'drama' },
      { title: 'Arrival', genre: 'sci-fi' },
    ];

    expect(groupBy(shows, 'genre')).toEqual({
      'sci-fi': [shows[0], shows[2]],
      drama: [shows[1]],
    });
  });

  test('should coerce numeric keys to strings', () => {
    const result = groupBy(['a', 'bb', 'cc', 'd'], (s) => s.length);

    expect(Object.keys(result)).toEqual(['1', '2']);
    expect(result['1']).toEqual(['a', 'd']);
    expect(result['2']).toEqual(['bb', 'cc']);
  });

  test('should group missing values under "undefined"', () => {
    const items: { a?: number }[] = [{ a: 1 }, {}, { a: undefined }];

    expect(groupBy(items, 'a')).toEqual({
      '1': [{ a: 1 }],
      undefined: [{}, { a: undefined }],
    });
  });

  test('should coerce boolean and null keys to strings', () => {
    const result = groupBy([0, 1, null, 2], (n) => (n === null ? null : n > 0));

    expect(result).toEqual({ false: [0], true: [1, 2], null: [null] });
  });

  test('should return an empty object for empty input', () => {
    expect(groupBy([], (x) => x)).toEqual({});
  });

  test('should order buckets by first appearance of the key', () => {
    const words = ['pear', 'apple', 'plum', 'avocado', 'banana'];

    expect(Object.keys(groupBy(words, (w) => w[0]))).toEqual(['p', 'a', 'b']);
  });

  test('should keep items in original relative order within a bucket', () => {
    const items = [
      { id: 1, k: 'x' },
      { id: 2, k: 'y' },
      { id: 3, k: 'x' },
      { id: 4, k: 'x' },
      { id: 5, k: 'y' },
    ];
    const result = groupBy(items, 'k');

    expect(result.x.map((i) => i.id)).toEqual([1, 3, 4]);
    expect(result.y.map((i) => i.id)).toEqual([2, 5]);
  });

  test('should not mutate the input and should return fresh bucket arrays', () => {
    const items = [1, 2, 3];
    const snapshot = [...items];
    const result = groupBy(items, () => 'all');

    expect(items).toEqual(snapshot);
    expect(result.all).not.toBe(items);
    expect(result.all).toEqual([1, 2, 3]);
  });

  test('should handle keys that collide with Object.prototype members', () => {
    const result = groupBy(
      ['constructor', 'toString', 'hasOwnProperty'],
      (s) => s,
    );

    expect(result.constructor).toEqual(['constructor']);
    expect(result.toString).toEqual(['toString']);
    expect(result.hasOwnProperty).toEqual(['hasOwnProperty']);
  });

  test('should pass the item (not the index) to the iteratee', () => {
    const iteratee = jest.fn((item: string) => item.toUpperCase());

    groupBy(['a', 'b'], iteratee);

    expect(iteratee).toHaveBeenNthCalledWith(1, 'a');
    expect(iteratee).toHaveBeenNthCalledWith(2, 'b');
  });
});
