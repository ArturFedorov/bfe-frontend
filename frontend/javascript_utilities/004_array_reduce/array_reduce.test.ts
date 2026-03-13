import { myReduce } from "./array_reduce";

describe("myReduce", () => {
  test("should sum numbers with initial value", () => {
    expect(myReduce([1, 2, 3, 4], (acc, val) => acc + val, 0)).toBe(10);
  });

  test("should work with initial value", () => {
    expect(myReduce([1, 2, 3], (acc, val) => acc + val, 10)).toBe(16);
  });

  test("should work without initial value", () => {
    expect(myReduce([1, 2, 3, 4], (acc: number, val: number) => acc + val)).toBe(10);
  });

  test("should return initial value for empty array with initial value", () => {
    expect(myReduce([] as number[], (acc, val) => acc + val, 42)).toBe(42);
  });

  test("should throw for empty array without initial value", () => {
    expect(() => {
      myReduce([] as number[], (acc: number, val: number) => acc + val);
    }).toThrow();
  });

  test("should concatenate strings", () => {
    expect(myReduce(["a", "b", "c"], (acc, val) => acc + val, "")).toBe("abc");
  });
});
