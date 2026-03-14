import { myFlat } from './array_flat';

describe('myFlat', () => {
  test('should flat with default depth 1', () => {
    expect(myFlat([1, [2, 3], [4, [5]]])).toEqual([1, 2, 3, 4, [5]]);
  });

  test('should flat with depth 2', () => {
    expect(myFlat([1, [2, [3, [4]]]], 2)).toEqual([1, 2, 3, [4]]);
  });

  test('should flat with Infinity depth', () => {
    expect(myFlat([1, [2, [3, [4, [5]]]]], Infinity)).toEqual([1, 2, 3, 4, 5]);
  });

  test('should return shallow copy with depth 0', () => {
    const arr = [1, [2, 3], 4];
    const result = myFlat(arr, 0);
    expect(result).toEqual([1, [2, 3], 4]);
    expect(result).not.toBe(arr);
  });

  test('should return empty array for empty input', () => {
    expect(myFlat([])).toEqual([]);
  });

  test('should handle deeply nested arrays', () => {
    expect(myFlat([[[[[[1]]]]]], Infinity)).toEqual([1]);
  });
});
