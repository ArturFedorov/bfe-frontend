import { myBind } from './function_bind';

describe('myBind', () => {
  test('should bind this context', () => {
    const obj = { x: 42 };
    function getX(this: any) {
      return this.x;
    }
    const bound = myBind(getX, obj);
    expect(bound()).toBe(42);
  });

  test('should support partial application', () => {
    function add(a: number, b: number) {
      return a + b;
    }
    const add5 = myBind(add, null, 5);
    expect(add5(3)).toBe(8);
  });

  test('should combine bound and call-time args', () => {
    function sum(a: number, b: number, c: number) {
      return a + b + c;
    }
    const partial = myBind(sum, null, 1, 2);
    expect(partial(3)).toBe(6);
  });

  test('should work with empty bound args', () => {
    function identity(x: number) {
      return x;
    }
    const bound = myBind(identity, null);
    expect(bound(99)).toBe(99);
  });

  test('should bind to null this', () => {
    function greet(name: string) {
      return `hello ${name}`;
    }
    const bound = myBind(greet, null);
    expect(bound('world')).toBe('hello world');
  });

  test('should support chained bind', () => {
    function add(a: number, b: number, c: number) {
      return a + b + c;
    }
    const bound1 = myBind(add, null, 1);
    const bound2 = myBind(bound1, null, 2);
    expect(bound2(3)).toBe(6);
  });
});
