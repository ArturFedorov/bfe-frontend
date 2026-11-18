import { _, partial } from './partial';

const join = (...parts: unknown[]) => parts.join('-');

describe('partial', () => {
  test('should preset leading arguments', () => {
    const greet = (greeting: string, name: string) => `${greeting}, ${name}!`;
    const hello = partial(greet, 'Hello');

    expect(hello('Ada')).toBe('Hello, Ada!');
  });

  test('should fill a placeholder from the call-time argument', () => {
    const subtract = (a: number, b: number) => a - b;
    const subtractFrom10 = partial(subtract, _, 10);

    expect(subtractFrom10(3)).toBe(-7);
  });

  test('should fill multiple placeholders in order', () => {
    const fill = partial(join, _, 'b', _, 'd');

    expect(fill('a', 'c')).toBe('a-b-c-d');
  });

  test('should append extra arguments after the placeholders are filled', () => {
    const fill = partial(join, _, 'b');

    expect(fill('a', 'c', 'd')).toBe('a-b-c-d');
  });

  test('should preserve `this` when invoked as a method', () => {
    const counter = {
      step: 10,
      add(this: { step: number }, a: number, b: number) {
        return this.step + a + b;
      },
    };
    const obj = { step: 100, addTwo: partial(counter.add, 2) };

    expect(obj.addTwo(3)).toBe(105);
  });

  test('should behave like fn when no arguments are preset', () => {
    const add = (a: number, b: number) => a + b;

    expect(partial(add)(1, 2)).toBe(3);
  });

  test('should turn an unfilled placeholder into undefined', () => {
    const fn = jest.fn((a: unknown, b: unknown) => [a, b]);
    const p = partial(fn, _, 2);

    expect(p()).toEqual([undefined, 2]);
    expect(fn).toHaveBeenCalledWith(undefined, 2);
  });

  test('should never pass the placeholder symbol through to fn', () => {
    const received = jest.fn((...args: unknown[]) => args);
    const p = partial(received, _, 'x', _);

    p(1);

    expect(received.mock.calls[0]).not.toContain(_);
  });

  test('should be reusable without leaking arguments between calls', () => {
    const p = partial(join, _, 'fixed', _);

    expect(p(1, 2)).toBe('1-fixed-2');
    expect(p('a', 'b')).toBe('a-fixed-b');
    expect(p()).toBe('-fixed-'); // undefined joins as ''
  });

  test('should compose with itself', () => {
    const sum3 = (a: number, b: number, c: number) => a + b + c;
    const p = partial(partial(sum3, 1), 2);

    expect(p(3)).toBe(6);
  });

  test('should export a symbol placeholder', () => {
    expect(typeof _).toBe('symbol');
  });
});
