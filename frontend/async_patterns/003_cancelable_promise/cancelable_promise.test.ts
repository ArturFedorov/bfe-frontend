import { makeCancelable } from "./cancelable_promise";

describe("makeCancelable", () => {
  it("should resolve normally when not canceled", async () => {
    const original = Promise.resolve(42);
    const { promise } = makeCancelable(original);

    await expect(promise).resolves.toBe(42);
  });

  it("should reject with Canceled when cancel is called before resolve", async () => {
    const original = new Promise<number>((resolve) => {
      setTimeout(() => resolve(42), 1000);
    });

    const { promise, cancel } = makeCancelable(original);
    cancel();

    await expect(promise).rejects.toThrow("Canceled");
  });

  it("should be a no-op when cancel is called after resolve", async () => {
    const original = Promise.resolve(42);
    const { promise, cancel } = makeCancelable(original);

    const result = await promise;
    expect(result).toBe(42);

    expect(() => cancel()).not.toThrow();
  });

  it("should reject with Canceled error containing correct message", async () => {
    const original = new Promise<string>(() => {});
    const { promise, cancel } = makeCancelable(original);

    cancel();

    try {
      await promise;
      fail("should have thrown");
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe("Canceled");
    }
  });
});
