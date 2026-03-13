import { createRateLimiter } from "./rate_limiter";

describe("createRateLimiter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should allow up to maxTokens immediately", async () => {
    const limiter = createRateLimiter(3, 1);

    const r1 = limiter.acquire();
    const r2 = limiter.acquire();
    const r3 = limiter.acquire();

    await expect(r1).resolves.toBeUndefined();
    await expect(r2).resolves.toBeUndefined();
    await expect(r3).resolves.toBeUndefined();
  });

  it("should block when tokens are exhausted", async () => {
    const limiter = createRateLimiter(1, 1);
    let secondAcquired = false;

    await limiter.acquire();
    limiter.acquire().then(() => {
      secondAcquired = true;
    });

    await Promise.resolve();
    expect(secondAcquired).toBe(false);
  });

  it("should refill tokens over time", async () => {
    const limiter = createRateLimiter(1, 1);
    let acquired = false;

    await limiter.acquire();

    limiter.acquire().then(() => {
      acquired = true;
    });

    await Promise.resolve();
    expect(acquired).toBe(false);

    await jest.advanceTimersByTimeAsync(1000);
    expect(acquired).toBe(true);
  });

  it("should queue concurrent requests in FIFO order", async () => {
    const limiter = createRateLimiter(1, 1);
    const order: number[] = [];

    await limiter.acquire();

    limiter.acquire().then(() => order.push(1));
    limiter.acquire().then(() => order.push(2));
    limiter.acquire().then(() => order.push(3));

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);

    expect(order).toEqual([1, 2, 3]);
  });
});
