import { myCall, myApply } from "./function_call_apply";

describe("myCall", () => {
  test("should call with this context", () => {
    const obj = { x: 10 };
    function getX(this: any) {
      return this.x;
    }
    expect(myCall(getX, obj)).toBe(10);
  });

  test("should pass arguments", () => {
    function add(a: number, b: number) {
      return a + b;
    }
    expect(myCall(add, null, 3, 4)).toBe(7);
  });

  test("should handle null thisArg", () => {
    function greet(name: string) {
      return `hi ${name}`;
    }
    expect(myCall(greet, null, "world")).toBe("hi world");
  });

  test("should work with no arguments", () => {
    function returnFive() {
      return 5;
    }
    expect(myCall(returnFive, null)).toBe(5);
  });
});

describe("myApply", () => {
  test("should call with this context", () => {
    const obj = { x: 20 };
    function getX(this: any) {
      return this.x;
    }
    expect(myApply(getX, obj)).toBe(20);
  });

  test("should pass array arguments", () => {
    function add(a: number, b: number) {
      return a + b;
    }
    expect(myApply(add, null, [3, 4])).toBe(7);
  });

  test("should handle null thisArg", () => {
    function greet(name: string) {
      return `hi ${name}`;
    }
    expect(myApply(greet, null, ["world"])).toBe("hi world");
  });

  test("should work with no args array", () => {
    function returnTen() {
      return 10;
    }
    expect(myApply(returnTen, null)).toBe(10);
  });
});
