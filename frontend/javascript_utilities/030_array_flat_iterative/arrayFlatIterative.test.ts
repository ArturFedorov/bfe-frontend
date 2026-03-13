import { flatIterative } from "./arrayFlatIterative";

describe("flatIterative", () => {
  test("should flatten one level by default", () => {
    expect(flatIterative([1, [2, [3]]])).toEqual([1, 2, [3]]);
  });

  test("should flatten to depth 1", () => {
    expect(flatIterative([1, [2, [3, [4]]]], 1)).toEqual([1, 2, [3, [4]]]);
  });

  test("should flatten to depth 2", () => {
    expect(flatIterative([1, [2, [3, [4]]]], 2)).toEqual([1, 2, 3, [4]]);
  });

  test("should fully flatten with depth Infinity", () => {
    expect(flatIterative([1, [2, [3, [4, [5]]]]], Infinity)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  test("should not flatten with depth 0", () => {
    expect(flatIterative([1, [2, [3]]], 0)).toEqual([1, [2, [3]]]);
  });

  test("should return empty array for empty array", () => {
    expect(flatIterative([])).toEqual([]);
  });

  test("should handle deeply nested arrays", () => {
    expect(flatIterative([[[[[[1]]]]]], Infinity)).toEqual([1]);
  });

  test("should produce same results as recursive Array.prototype.flat", () => {
    const input = [1, [2, 3], [4, [5, [6, [7]]]]];
    expect(flatIterative(input, 1)).toEqual(input.flat(1));
    expect(flatIterative(input, 2)).toEqual(input.flat(2));
    expect(flatIterative(input, Infinity)).toEqual(input.flat(Infinity));
  });
});
