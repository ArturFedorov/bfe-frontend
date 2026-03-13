import { promiseAny } from "./promiseAny";

describe("promiseAny", () => {
  test("should resolve with the first promise to resolve", async () => {
    const result = await promiseAny([
      new Promise((resolve) => setTimeout(() => resolve("slow"), 100)),
      new Promise((resolve) => setTimeout(() => resolve("fast"), 10)),
      new Promise((resolve) => setTimeout(() => resolve("medium"), 50)),
    ]);
    expect(result).toBe("fast");
  });

  test("should reject with AggregateError if all promises reject", async () => {
    await expect(
      promiseAny([
        Promise.reject("err1"),
        Promise.reject("err2"),
        Promise.reject("err3"),
      ])
    ).rejects.toThrow(AggregateError);
  });

  test("should reject with AggregateError for empty array", async () => {
    await expect(promiseAny([])).rejects.toThrow(AggregateError);
  });

  test("should handle a single promise", async () => {
    const result = await promiseAny([Promise.resolve(42)]);
    expect(result).toBe(42);
  });

  test("should resolve with the first resolved value regardless of order", async () => {
    const result = await promiseAny([
      new Promise((_, reject) => setTimeout(() => reject("fail"), 10)),
      new Promise((resolve) => setTimeout(() => resolve("winner"), 50)),
      new Promise((_, reject) => setTimeout(() => reject("fail2"), 20)),
    ]);
    expect(result).toBe("winner");
  });

  test("should handle non-promise values", async () => {
    const result = await promiseAny([1, 2, 3]);
    expect(result).toBe(1);
  });

  test("should preserve AggregateError errors array", async () => {
    try {
      await promiseAny([
        Promise.reject("e1"),
        Promise.reject("e2"),
      ]);
    } catch (err) {
      expect(err).toBeInstanceOf(AggregateError);
      expect((err as AggregateError).errors).toEqual(["e1", "e2"]);
    }
  });
});
