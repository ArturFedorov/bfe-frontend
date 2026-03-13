import { rafThrottle } from "./rafThrottle";

describe("rafThrottle", () => {
  let rafCallbacks: (() => void)[];

  beforeEach(() => {
    rafCallbacks = [];
    (globalThis as any).requestAnimationFrame = jest.fn((cb: () => void) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    (globalThis as any).cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    delete (globalThis as any).requestAnimationFrame;
    delete (globalThis as any).cancelAnimationFrame;
  });

  function flushRAF() {
    const cbs = [...rafCallbacks];
    rafCallbacks = [];
    cbs.forEach((cb) => cb());
  }

  it("should call the function on next animation frame", () => {
    const fn = jest.fn();
    const throttled = rafThrottle(fn);

    throttled();
    expect(fn).not.toHaveBeenCalled();

    flushRAF();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should skip intermediate calls and only use the latest", () => {
    const fn = jest.fn();
    const throttled = rafThrottle(fn);

    throttled(1);
    throttled(2);
    throttled(3);

    flushRAF();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("should pass latest arguments", () => {
    const fn = jest.fn();
    const throttled = rafThrottle(fn);

    throttled("a", "b");
    throttled("c", "d");

    flushRAF();
    expect(fn).toHaveBeenCalledWith("c", "d");
  });

  it("should preserve this context", () => {
    const obj = {
      value: 42,
      fn: jest.fn(function (this: any) {
        return this.value;
      }),
      throttled: null as any,
    };
    obj.throttled = rafThrottle(obj.fn);

    obj.throttled();
    flushRAF();

    expect(obj.fn).toHaveBeenCalledTimes(1);
    expect(obj.fn.mock.instances[0]).toBe(obj);
  });
});
