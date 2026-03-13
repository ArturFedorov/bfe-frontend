import { throttle } from "./throttle";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("throttle", () => {
  test("should invoke immediately on leading edge by default", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("should invoke at the end of the wait (trailing) by default", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("should skip calls made during the wait period", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled("a");
    throttled("b");
    throttled("c");

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("c");
  });

  test("should not invoke on leading edge when leading is false", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100, { leading: false });

    throttled();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("should not invoke on trailing edge when trailing is false", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100, { trailing: false });

    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("should preserve this context", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    const obj = { throttled };
    obj.throttled();

    expect(fn.mock.instances[0]).toBe(obj);
  });

  test("should pass the latest args to trailing call", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled(1);
    throttled(2);
    throttled(3);

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenLastCalledWith(3);
  });

  test("should allow a new leading call after wait expires", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    jest.advanceTimersByTime(100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
