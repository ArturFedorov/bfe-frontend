import { once } from './once';

describe('once', () => {
  test('should call the function on the first invocation', () => {
    const fn = jest.fn(() => 42);
    const onceFn = once(fn);

    onceFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should return the first result on subsequent calls', () => {
    const fn = jest.fn(() => 42);
    const onceFn = once(fn);

    expect(onceFn()).toBe(42);
    expect(onceFn()).toBe(42);
    expect(onceFn()).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should pass arguments to the function', () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const onceFn = once(fn);

    expect(onceFn(2, 3)).toBe(5);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });

  test('should preserve this context', () => {
    const fn = jest.fn(function (this: any) {
      return this.value;
    });
    const onceFn = once(fn);

    const obj = { value: 99, onceFn };
    expect(obj.onceFn()).toBe(99);
  });

  test('should return undefined result if fn returns undefined', () => {
    const fn = jest.fn(() => undefined);
    const onceFn = once(fn);

    expect(onceFn()).toBeUndefined();
    expect(onceFn()).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should not call fn again even with different arguments', () => {
    const fn = jest.fn((x: number) => x * 2);
    const onceFn = once(fn);

    expect(onceFn(5)).toBe(10);
    expect(onceFn(10)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
