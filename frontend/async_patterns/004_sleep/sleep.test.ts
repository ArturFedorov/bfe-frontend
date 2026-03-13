import { sleep } from "./sleep";

describe("sleep", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should resolve after the specified time", async () => {
    let resolved = false;

    const promise = sleep(1000).then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);

    jest.advanceTimersByTime(999);
    await Promise.resolve();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(1);
    await promise;
    expect(resolved).toBe(true);
  });

  it("should resolve with zero ms", async () => {
    let resolved = false;

    const promise = sleep(0).then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);

    jest.advanceTimersByTime(0);
    await promise;
    expect(resolved).toBe(true);
  });

  it("should work with async/await", async () => {
    const order: number[] = [];

    const run = async () => {
      order.push(1);
      const p = sleep(500);
      jest.advanceTimersByTime(500);
      await p;
      order.push(2);
    };

    await run();
    expect(order).toEqual([1, 2]);
  });
});
