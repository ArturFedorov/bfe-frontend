import { deepClone } from "./deepClone";

describe("deepClone", () => {
  test("should clone primitives", () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone("hello")).toBe("hello");
    expect(deepClone(true)).toBe(true);
  });

  test("should clone a plain object", () => {
    const obj = { a: 1, b: "two" };
    const cloned = deepClone(obj);

    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
  });

  test("should clone nested objects", () => {
    const obj = { a: { b: { c: 3 } } };
    const cloned = deepClone(obj);

    expect(cloned).toEqual(obj);
    expect(cloned.a).not.toBe(obj.a);
    expect(cloned.a.b).not.toBe(obj.a.b);
  });

  test("should clone arrays", () => {
    const arr = [1, [2, [3]]];
    const cloned = deepClone(arr);

    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[1]).not.toBe(arr[1]);
  });

  test("should clone Date objects", () => {
    const date = new Date("2024-01-01");
    const cloned = deepClone(date);

    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
    expect(cloned instanceof Date).toBe(true);
  });

  test("should clone RegExp objects", () => {
    const regex = /test/gi;
    const cloned = deepClone(regex);

    expect(cloned).toEqual(regex);
    expect(cloned).not.toBe(regex);
    expect(cloned instanceof RegExp).toBe(true);
    expect(cloned.flags).toBe(regex.flags);
  });

  test("should clone Map objects", () => {
    const map = new Map<string, number>([["a", 1], ["b", 2]]);
    const cloned = deepClone(map);

    expect(cloned).toEqual(map);
    expect(cloned).not.toBe(map);
    expect(cloned instanceof Map).toBe(true);
  });

  test("should clone Set objects", () => {
    const set = new Set([1, 2, 3]);
    const cloned = deepClone(set);

    expect(cloned).toEqual(set);
    expect(cloned).not.toBe(set);
    expect(cloned instanceof Set).toBe(true);
  });

  test("should handle circular references", () => {
    const obj: any = { a: 1 };
    obj.self = obj;

    const cloned = deepClone(obj);

    expect(cloned.a).toBe(1);
    expect(cloned.self).toBe(cloned);
    expect(cloned).not.toBe(obj);
  });

  test("should handle null and undefined", () => {
    expect(deepClone(null)).toBeNull();
    expect(deepClone(undefined)).toBeUndefined();
  });
});
