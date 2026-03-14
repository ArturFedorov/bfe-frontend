import { myFind, myFindIndex } from './array_find';

describe('myFind', () => {
  test('should find existing element', () => {
    expect(myFind([1, 2, 3, 4], (x) => x > 2)).toBe(3);
  });

  test('should return undefined when not found', () => {
    expect(myFind([1, 2, 3], (x) => x > 10)).toBeUndefined();
  });

  test('should return undefined for empty array', () => {
    expect(myFind([], () => true)).toBeUndefined();
  });
});

describe('myFindIndex', () => {
  test('should find index of existing element', () => {
    expect(myFindIndex([1, 2, 3, 4], (x) => x > 2)).toBe(2);
  });

  test('should return -1 when not found', () => {
    expect(myFindIndex([1, 2, 3], (x) => x > 10)).toBe(-1);
  });

  test('should return -1 for empty array', () => {
    expect(myFindIndex([], () => true)).toBe(-1);
  });
});
