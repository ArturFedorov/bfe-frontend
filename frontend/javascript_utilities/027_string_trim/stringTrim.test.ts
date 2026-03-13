import { myTrim } from "./stringTrim";

describe("myTrim", () => {
  test("should remove leading spaces", () => {
    expect(myTrim("   hello")).toBe("hello");
  });

  test("should remove trailing spaces", () => {
    expect(myTrim("hello   ")).toBe("hello");
  });

  test("should remove both leading and trailing spaces", () => {
    expect(myTrim("   hello   ")).toBe("hello");
  });

  test("should remove tabs and newlines", () => {
    expect(myTrim("\t\n hello world \r\n\t")).toBe("hello world");
  });

  test("should return the same string if no whitespace to trim", () => {
    expect(myTrim("no whitespace")).toBe("no whitespace");
  });

  test("should return empty string for empty string", () => {
    expect(myTrim("")).toBe("");
  });

  test("should return empty string for only whitespace", () => {
    expect(myTrim("   \t\n\r  ")).toBe("");
  });
});
