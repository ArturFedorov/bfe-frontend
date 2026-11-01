import { spyOn } from './spy_on_method';

describe('spyOn', () => {
  it('records calls, calls through, and restores', () => {
    const obj = { greet: (name: string) => `hi ${name}` };
    const original = obj.greet;

    const spy = spyOn(obj, 'greet');
    expect(obj.greet('a')).toBe('hi a');
    expect(spy.calls).toEqual([['a']]);

    spy.restore();
    expect(obj.greet).toBe(original);
  });

  it('starts with an empty calls array before any invocation', () => {
    const obj = { greet: (name: string) => `hi ${name}` };
    const spy = spyOn(obj, 'greet');
    expect(spy.calls).toEqual([]);
  });

  it('accumulates multiple calls in order', () => {
    const obj = { greet: (name: string) => `hi ${name}` };
    const spy = spyOn(obj, 'greet');
    obj.greet('a');
    obj.greet('b');
    obj.greet('c');
    expect(spy.calls).toEqual([['a'], ['b'], ['c']]);
  });

  it('records calls with multiple arguments', () => {
    const obj = { add: (a: number, b: number) => a + b };
    const spy = spyOn(obj, 'add');
    expect(obj.add(2, 3)).toBe(5);
    expect(spy.calls).toEqual([[2, 3]]);
  });

  it('records a call with no arguments as an empty args tuple', () => {
    const obj = { ping: () => 'pong' };
    const spy = spyOn(obj, 'ping');
    obj.ping();
    expect(spy.calls).toEqual([[]]);
  });

  it('preserves the return value on every call', () => {
    const obj = { double: (n: number) => n * 2 };
    const spy = spyOn(obj, 'double');
    expect(obj.double(2)).toBe(4);
    expect(obj.double(5)).toBe(10);
    expect(spy.calls).toEqual([[2], [5]]);
  });

  it('preserves the `this` binding when the method reads instance state', () => {
    const obj = {
      value: 42,
      getValue() {
        return this.value;
      },
    };
    spyOn(obj, 'getValue');
    expect(obj.getValue()).toBe(42);
  });

  it('stops recording calls made after restore()', () => {
    const obj = { greet: (name: string) => `hi ${name}` };
    const spy = spyOn(obj, 'greet');
    obj.greet('a');
    spy.restore();
    obj.greet('b');
    expect(spy.calls).toEqual([['a']]);
  });

  it('lets restore() be called more than once without throwing', () => {
    const obj = { greet: (name: string) => `hi ${name}` };
    const spy = spyOn(obj, 'greet');
    spy.restore();
    expect(() => spy.restore()).not.toThrow();
  });

  it('keeps independent call logs for spies on different methods', () => {
    const obj = {
      greet: (name: string) => `hi ${name}`,
      farewell: (name: string) => `bye ${name}`,
    };
    const greetSpy = spyOn(obj, 'greet');
    const farewellSpy = spyOn(obj, 'farewell');
    obj.greet('a');
    obj.farewell('b');
    expect(greetSpy.calls).toEqual([['a']]);
    expect(farewellSpy.calls).toEqual([['b']]);
  });
});
