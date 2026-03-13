import { createDeferred } from "./lazy_promise";

describe("createDeferred", () => {
  it("should resolve externally", async () => {
    const deferred = createDeferred<number>();
    deferred.resolve(42);

    await expect(deferred.promise).resolves.toBe(42);
  });

  it("should reject externally", async () => {
    const deferred = createDeferred<number>();
    deferred.reject(new Error("fail"));

    await expect(deferred.promise).rejects.toThrow("fail");
  });

  it("should remain pending until resolved", async () => {
    const deferred = createDeferred<string>();
    let settled = false;

    deferred.promise.then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    deferred.resolve("done");
    await deferred.promise;
    expect(settled).toBe(true);
  });

  it("should ignore multiple resolves", async () => {
    const deferred = createDeferred<number>();
    deferred.resolve(1);
    deferred.resolve(2);
    deferred.resolve(3);

    await expect(deferred.promise).resolves.toBe(1);
  });
});
