import { curry } from './curry';

describe('curry', () => {
  test('should curry a binary function', () => {
    const add = (a: number, b: number) => a + b;
    const curriedAdd = curry(add);

    expect(curriedAdd(1)(2)).toBe(3);
  });

  test('should curry a ternary function', () => {
    const sum = (a: number, b: number, c: number) => a + b + c;
    const curriedSum = curry(sum);

    expect(curriedSum(1)(2)(3)).toBe(6);
  });

  test('should work when called with all args at once', () => {
    const add = (a: number, b: number) => a + b;
    const curriedAdd = curry(add);

    expect(curriedAdd(1, 2)).toBe(3);
  });

  test('should work when called one arg at a time', () => {
    const fn = (a: number, b: number, c: number, d: number) => a + b + c + d;
    const curried = curry(fn);

    expect(curried(1)(2)(3)(4)).toBe(10);
  });

  test('should support mixed partial application', () => {
    const fn = (a: number, b: number, c: number, d: number) => a + b + c + d;
    const curried = curry(fn);

    expect(curried(1, 2)(3, 4)).toBe(10);
    expect(curried(1)(2, 3)(4)).toBe(10);
    expect(curried(1, 2, 3)(4)).toBe(10);
  });

  test('should handle zero-arg function', () => {
    const fn = () => 42;
    const curried = curry(fn);

    expect(curried()).toBe(42);
  });
});
