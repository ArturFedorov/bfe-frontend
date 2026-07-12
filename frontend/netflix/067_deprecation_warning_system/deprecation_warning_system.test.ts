import { deprecate, reset } from './deprecation_warning_system';

describe('deprecate', () => {
  beforeEach(() => reset());

  it('warns once then delegates', () => {
    const logs: string[] = [];
    const add = deprecate(
      (a: number, b: number) => a + b,
      'use sum() instead',
      (m) => logs.push(m),
    );
    expect(add(1, 2)).toBe(3);
    expect(add(3, 4)).toBe(7);
    expect(logs).toEqual(['use sum() instead']);
  });

  it('returns the original result on every call, not just the first', () => {
    const logs: string[] = [];
    const double = deprecate(
      (n: number) => n * 2,
      'use multiply() instead',
      (m) => logs.push(m),
    );
    expect(double(1)).toBe(2);
    expect(double(2)).toBe(4);
    expect(double(3)).toBe(6);
    expect(logs).toEqual(['use multiply() instead']);
  });

  it('warns again after reset() is called', () => {
    const logs: string[] = [];
    const add = deprecate(
      (a: number, b: number) => a + b,
      'use sum() instead',
      (m) => logs.push(m),
    );
    add(1, 2);
    reset();
    add(3, 4);
    expect(logs).toEqual(['use sum() instead', 'use sum() instead']);
  });

  it('tracks warnings per unique message, independent of which function raised it', () => {
    const logs: string[] = [];
    const add = deprecate(
      (a: number, b: number) => a + b,
      'shared message',
      (m) => logs.push(m),
    );
    const sub = deprecate(
      (a: number, b: number) => a - b,
      'shared message',
      (m) => logs.push(m),
    );
    add(1, 2);
    sub(5, 2);
    expect(logs).toEqual(['shared message']);
  });

  it('warns independently for each distinct message', () => {
    const logs: string[] = [];
    const add = deprecate(
      (a: number, b: number) => a + b,
      'message A',
      (m) => logs.push(m),
    );
    const sub = deprecate(
      (a: number, b: number) => a - b,
      'message B',
      (m) => logs.push(m),
    );
    add(1, 2);
    sub(5, 2);
    add(3, 4);
    expect(logs).toEqual(['message A', 'message B']);
  });

  it('forwards arbitrary argument counts, including none', () => {
    const logs: string[] = [];
    const greet = deprecate(
      (...names: string[]) => `hello ${names.join(', ')}`,
      'use greetAll() instead',
      (m) => logs.push(m),
    );
    expect(greet()).toBe('hello ');
    expect(greet('a', 'b', 'c')).toBe('hello a, b, c');
    expect(logs).toEqual(['use greetAll() instead']);
  });

  it('defaults to console.warn when no logger is provided', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const add = deprecate((a: number, b: number) => a + b, 'use sum() instead');
    add(1, 2);
    add(3, 4);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('use sum() instead');
    warnSpy.mockRestore();
  });

  it('reset() with nothing previously warned does not throw', () => {
    expect(() => reset()).not.toThrow();
  });
});
