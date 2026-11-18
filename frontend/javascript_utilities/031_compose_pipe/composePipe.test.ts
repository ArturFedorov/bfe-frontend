import { compose, pipe } from './composePipe';

const double = (n: number) => n * 2;
const inc = (n: number) => n + 1;
const square = (n: number) => n * n;

describe('compose', () => {
  test('should apply functions right to left', () => {
    // double(inc(square(3))) = double(inc(9)) = double(10) = 20
    expect(compose(double, inc, square)(3)).toBe(20);
  });

  test('should return identity when called with no functions', () => {
    const identity = compose();

    expect(identity(42)).toBe(42);
    expect(identity('a', 'b')).toBe('a');
    expect(identity()).toBeUndefined();
  });

  test('should let the first (rightmost) function take many arguments', () => {
    const add = (a: number, b: number, c: number) => a + b + c;

    expect(compose(double, add)(1, 2, 3)).toBe(12);
  });

  test('should behave like the function itself when given one function', () => {
    const add = (a: number, b: number) => a + b;

    expect(compose(add)(2, 3)).toBe(5);
  });

  test('should not call any function at composition time', () => {
    const spy = jest.fn(double);
    const composed = compose(spy, inc);

    expect(spy).not.toHaveBeenCalled();
    composed(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('pipe', () => {
  test('should apply functions left to right', () => {
    // square(inc(double(3))) = square(inc(6)) = square(7) = 49
    expect(pipe(double, inc, square)(3)).toBe(49);
  });

  test('should return identity when called with no functions', () => {
    const identity = pipe();

    expect(identity(7)).toBe(7);
    expect(identity(1, 2)).toBe(1);
  });

  test('should let the first (leftmost) function take many arguments', () => {
    const add = (a: number, b: number) => a + b;

    expect(pipe(add, double)(2, 3)).toBe(10);
  });

  test('should flow types through a number -> string -> number chain', () => {
    const toLength = pipe(
      (n: number) => n * 111,
      (n: number) => `#${n}`,
      (s: string) => s.length,
    );

    expect(toLength(3)).toBe(4); // '#333'.length
  });

  test('should pass an array result as a single argument, not spread it', () => {
    const toPair = (n: number) => [n, n + 1];
    const received = jest.fn((value: unknown) => value);

    pipe(toPair, received)(1);

    expect(received).toHaveBeenCalledTimes(1);
    expect(received).toHaveBeenCalledWith([1, 2]);
  });

  test('should forward undefined between steps', () => {
    const next = jest.fn(() => 'done');

    expect(pipe(() => undefined, next)()).toBe('done');
    expect(next).toHaveBeenCalledWith(undefined);
  });

  test('compose(f, g, h) should equal pipe(h, g, f)', () => {
    for (const n of [0, 1, 5, -3]) {
      expect(compose(double, inc, square)(n)).toBe(
        pipe(square, inc, double)(n),
      );
    }
  });
});
