import { fn } from './mock_function';

describe('mock fn', () => {
  it('records calls, args and results', () => {
    const m = fn<[number, number], number>((a, b) => a + b);
    expect(m(1, 2)).toBe(3);
    expect(m(3, 4)).toBe(7);
    expect(m.calls).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(m.results).toEqual([3, 7]);
  });

  it('supports mockReturnValue and mockImplementation', () => {
    const m = fn<[], string>().mockReturnValue('x');
    expect(m()).toBe('x');
    m.mockImplementation(() => 'y');
    expect(m()).toBe('y');
  });

  it('starts with empty calls and results', () => {
    const m = fn<[number], number>();
    expect(m.calls).toEqual([]);
    expect(m.results).toEqual([]);
  });

  it('returns undefined and records calls when no implementation is given', () => {
    const m = fn<[string], void>();
    expect(m('a')).toBeUndefined();
    expect(m('b')).toBeUndefined();
    expect(m.calls).toEqual([['a'], ['b']]);
    expect(m.results).toEqual([undefined, undefined]);
  });

  it('returns the mock from mockReturnValue and mockImplementation for chaining', () => {
    const m = fn<[], number>();
    expect(m.mockReturnValue(1)).toBe(m);
    expect(m.mockImplementation(() => 2)).toBe(m);
  });

  it('records args and results when using mockReturnValue', () => {
    const m = fn<[number, number], number>().mockReturnValue(42);
    m(1, 2);
    m(3, 4);
    expect(m.calls).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(m.results).toEqual([42, 42]);
  });

  it('lets mockReturnValue override an initial implementation', () => {
    const m = fn<[], string>(() => 'orig');
    expect(m()).toBe('orig');
    m.mockReturnValue('overridden');
    expect(m()).toBe('overridden');
  });

  it('uses the latest implementation set, accumulating all calls', () => {
    const m = fn<[number], number>((n) => n * 2);
    expect(m(2)).toBe(4);
    m.mockImplementation((n) => n + 100);
    expect(m(2)).toBe(102);
    expect(m.calls).toEqual([[2], [2]]);
    expect(m.results).toEqual([4, 102]);
  });

  it('passes all arguments through to the implementation', () => {
    const received: unknown[][] = [];
    const m = fn<[number, string, boolean], void>((...args) => {
      received.push(args);
    });
    m(1, 'a', true);
    expect(received).toEqual([[1, 'a', true]]);
  });
});
