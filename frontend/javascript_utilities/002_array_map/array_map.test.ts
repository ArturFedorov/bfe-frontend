import { myMap } from './array_map';

describe('myMap', () => {
  test('should map values with basic callback', () => {
    expect(myMap([1, 2, 3], (x) => x * 2)).toEqual([2, 4, 6]);
  });

  test('should pass index as second argument', () => {
    expect(myMap(['a', 'b', 'c'], (_, i) => i)).toEqual([0, 1, 2]);
  });

  test('should pass original array as third argument', () => {
    const arr = [1, 2, 3];
    myMap(arr, (_, __, array) => {
      expect(array).toBe(arr);
      return 0;
    });
  });

  test('should return empty array for empty input', () => {
    expect(myMap([], (x) => x)).toEqual([]);
  });

  test('should handle sparse arrays', () => {
    const sparse = [1, , 3] as number[];
    const result = myMap(sparse, (x) => (x === undefined ? 'empty' : x));
    expect(result.length).toBe(3);
  });

  test('should handle type coercion in callback', () => {
    expect(myMap([1, 2, 3], (x) => String(x))).toEqual(['1', '2', '3']);
    expect(myMap(['1', '2', '3'], (x) => Number(x))).toEqual([1, 2, 3]);
  });
});
