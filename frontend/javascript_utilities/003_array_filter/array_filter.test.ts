import { myFilter } from './array_filter';

describe('myFilter', () => {
  test('should filter values with basic callback', () => {
    expect(myFilter([1, 2, 3, 4, 5], (x) => x > 3)).toEqual([4, 5]);
  });

  test('should pass index as second argument', () => {
    expect(myFilter([10, 20, 30, 40], (_, i) => i % 2 === 0)).toEqual([10, 30]);
  });

  test('should return empty array for empty input', () => {
    expect(myFilter([], () => true)).toEqual([]);
  });

  test('should return all elements when all match', () => {
    expect(myFilter([2, 4, 6], (x) => x % 2 === 0)).toEqual([2, 4, 6]);
  });

  test('should return empty array when none match', () => {
    expect(myFilter([1, 3, 5], (x) => x % 2 === 0)).toEqual([]);
  });

  test('should handle sparse arrays', () => {
    const sparse = [1, , 3, , 5] as number[];
    const result = myFilter(sparse, (x) => x !== undefined);
    expect(result).toEqual([1, 3, 5]);
  });
});
