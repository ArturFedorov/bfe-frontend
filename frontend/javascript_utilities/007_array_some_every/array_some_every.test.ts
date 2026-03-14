import { mySome, myEvery } from './array_some_every';

describe('mySome', () => {
  test('should return true when at least one matches', () => {
    expect(mySome([1, 2, 3], (x) => x === 2)).toBe(true);
  });

  test('should return false when none match', () => {
    expect(mySome([1, 2, 3], (x) => x > 10)).toBe(false);
  });

  test('should return false for empty array', () => {
    expect(mySome([], () => true)).toBe(false);
  });

  test('should short-circuit on first true', () => {
    const fn = jest.fn((x: number) => x === 1);
    mySome([1, 2, 3], fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('myEvery', () => {
  test('should return true when all match', () => {
    expect(myEvery([2, 4, 6], (x) => x % 2 === 0)).toBe(true);
  });

  test('should return false when one does not match', () => {
    expect(myEvery([2, 3, 6], (x) => x % 2 === 0)).toBe(false);
  });

  test('should return true for empty array', () => {
    expect(myEvery([], () => false)).toBe(true);
  });

  test('should short-circuit on first false', () => {
    const fn = jest.fn((x: number) => x === 0);
    myEvery([1, 2, 3], fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
