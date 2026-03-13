import { createTimerManager } from "./clearAllTimers";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("createTimerManager", () => {
  test("should track and execute setTimeout", () => {
    const manager = createTimerManager();
    const fn = jest.fn();
    manager.setTimeout(fn, 100);

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("should track and execute setInterval", () => {
    const manager = createTimerManager();
    const fn = jest.fn();
    manager.setInterval(fn, 100);

    jest.advanceTimersByTime(350);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test("clearAll should cancel all active timers", () => {
    const manager = createTimerManager();
    const timeoutFn = jest.fn();
    const intervalFn = jest.fn();

    manager.setTimeout(timeoutFn, 200);
    manager.setTimeout(timeoutFn, 400);
    manager.setInterval(intervalFn, 100);

    jest.advanceTimersByTime(50);
    manager.clearAll();

    jest.advanceTimersByTime(1000);
    expect(timeoutFn).not.toHaveBeenCalled();
    expect(intervalFn).not.toHaveBeenCalled();
  });

  test("new timers after clearAll should work normally", () => {
    const manager = createTimerManager();
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    manager.setTimeout(fn1, 100);
    manager.clearAll();

    manager.setTimeout(fn2, 100);
    jest.advanceTimersByTime(100);

    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledTimes(1);
  });
});
