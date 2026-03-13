import { MyPromise } from "./customPromise";

describe("MyPromise", () => {
  test("should resolve with a value", (done) => {
    new MyPromise<number>((resolve) => resolve(42)).then((value) => {
      expect(value).toBe(42);
      done();
    });
  });

  test("should reject with a reason", (done) => {
    new MyPromise<number>((_, reject) => reject("error")).catch((reason) => {
      expect(reason).toBe("error");
      done();
    });
  });

  test("should support then chaining", (done) => {
    new MyPromise<number>((resolve) => resolve(1))
      .then((value) => value + 1)
      .then((value) => value * 3)
      .then((value) => {
        expect(value).toBe(6);
        done();
      });
  });

  test("should catch errors in then chain", (done) => {
    new MyPromise<number>((resolve) => resolve(1))
      .then(() => {
        throw new Error("oops");
      })
      .catch((err) => {
        expect(err.message).toBe("oops");
        done();
      });
  });

  test("should handle async resolve", (done) => {
    new MyPromise<string>((resolve) => {
      setTimeout(() => resolve("async"), 10);
    }).then((value) => {
      expect(value).toBe("async");
      done();
    });
  });

  test("should support multiple then on the same promise", (done) => {
    const p = new MyPromise<number>((resolve) => resolve(10));
    let count = 0;

    p.then((value) => {
      expect(value).toBe(10);
      count++;
      if (count === 2) done();
    });

    p.then((value) => {
      expect(value).toBe(10);
      count++;
      if (count === 2) done();
    });
  });

  test("static resolve should create a resolved promise", (done) => {
    MyPromise.resolve("hello").then((value) => {
      expect(value).toBe("hello");
      done();
    });
  });

  test("static reject should create a rejected promise", (done) => {
    MyPromise.reject("fail").catch((reason) => {
      expect(reason).toBe("fail");
      done();
    });
  });

  test("should handle then returning a MyPromise", (done) => {
    new MyPromise<number>((resolve) => resolve(1))
      .then((value) => new MyPromise<number>((resolve) => resolve(value + 10)))
      .then((value) => {
        expect(value).toBe(11);
        done();
      });
  });
});
