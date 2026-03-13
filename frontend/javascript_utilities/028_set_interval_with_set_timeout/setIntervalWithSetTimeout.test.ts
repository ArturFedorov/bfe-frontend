import { mySetInterval } from "./setIntervalWithSetTimeout";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("mySetInterval", () => {
  test("should call callback repeatedly", () => {
    const fn = jest.fn();
    mySetInterval(fn, 100);

    jest.advanceTimersByTime(350);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test("should call callback at the correct delay intervals", () => {
    const fn = jest.fn();
    mySetInterval(fn, 200);

    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test("clear should stop further executions", () => {
    const fn = jest.fn();
    const interval = mySetInterval(fn, 100);

    jest.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledTimes(2);

    interval.clear();

    jest.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("should pass additional arguments to callback", () => {
    const fn = jest.fn();
    mySetInterval(fn, 100, "a", 42);

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("a", 42);
  });

  test("should not call callback immediately", () => {
    const fn = jest.fn();
    mySetInterval(fn, 100);

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
