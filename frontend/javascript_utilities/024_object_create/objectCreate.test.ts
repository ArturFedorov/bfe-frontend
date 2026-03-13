import { objectCreate } from "./objectCreate";

describe("objectCreate", () => {
  test("should create an object that inherits from proto", () => {
    const proto = { greet: () => "hello" };
    const obj = objectCreate(proto);

    expect(obj.greet()).toBe("hello");
  });

  test("should create an object with null prototype", () => {
    const obj = objectCreate(null);

    expect(Object.getPrototypeOf(obj)).toBeNull();
  });

  test("should define properties from property descriptors", () => {
    const obj = objectCreate({}, {
      name: {
        value: "test",
        writable: true,
        enumerable: true,
        configurable: true,
      },
    });

    expect(obj.name).toBe("test");
  });

  test("should support instanceof check via prototype chain", () => {
    function Animal(this: any) {}
    Animal.prototype.type = "animal";

    const dog = objectCreate(Animal.prototype);

    expect(dog instanceof Animal).toBe(true);
    expect(dog.type).toBe("animal");
  });

  test("should allow access to methods defined on proto", () => {
    const proto = {
      double(this: any) {
        return this.value * 2;
      },
    };

    const obj = objectCreate(proto);
    obj.value = 5;

    expect(obj.double()).toBe(10);
  });

  test("should not have own properties from proto", () => {
    const proto = { a: 1 };
    const obj = objectCreate(proto);

    expect(obj.a).toBe(1);
    expect(obj.hasOwnProperty("a")).toBe(false);
  });

  test("should handle property descriptors with getters", () => {
    const obj = objectCreate({}, {
      foo: {
        get() {
          return 42;
        },
        enumerable: true,
        configurable: true,
      },
    });

    expect(obj.foo).toBe(42);
  });
});
