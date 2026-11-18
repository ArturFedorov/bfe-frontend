import { isPureCall, memoizePure } from './pureFunctionAudit';

describe('isPureCall', () => {
  test('should report a pure function as deterministic and non-mutating', () => {
    const report = isPureCall((a: number, b: number) => a + b, [1, 2]);

    expect(report).toEqual({
      deterministic: true,
      mutatesArgs: false,
      results: [3, 3, 3],
    });
    expect(isPureCall(() => undefined, [])).toEqual({
      deterministic: true,
      mutatesArgs: false,
      results: [undefined, undefined, undefined],
    });
  });

  test('should report Math.random as non-deterministic', () => {
    const report = isPureCall(() => Math.random(), []);

    expect(report.deterministic).toBe(false);
    expect(report.mutatesArgs).toBe(false);
    expect(report.results).toHaveLength(3);
  });

  test('should detect a push into an array argument without touching the caller args', () => {
    const args: [number[]] = [[0]];
    const report = isPureCall((list: number[]) => list.push(1), args);

    expect(report.mutatesArgs).toBe(true);
    expect(report.deterministic).toBe(true); // push returns 2 every run
    expect(args).toEqual([[0]]);
  });

  test('should detect a nested mutation of an object argument', () => {
    const report = isPureCall(
      (state: { user: { name: string } }) => {
        state.user.name = state.user.name.toUpperCase();
        return state.user.name;
      },
      [{ user: { name: 'ada' } }],
    );

    expect(report.mutatesArgs).toBe(true);
  });

  test('should honor the runs option', () => {
    const fn = jest.fn((n: number) => n);

    const report = isPureCall(fn, [7], { runs: 5 });

    expect(fn).toHaveBeenCalledTimes(5);
    expect(report.results).toEqual([7, 7, 7, 7, 7]);
  });

  test('should throw RangeError for runs below 1', () => {
    expect(() => isPureCall(() => 1, [], { runs: 0 })).toThrow(RangeError);
  });

  test('should compare results structurally, not by reference', () => {
    const report = isPureCall((n: number) => ({ value: n, tags: ['x'] }), [1]);

    expect(report.deterministic).toBe(true);
    expect(report.results[0]).not.toBe(report.results[1]);
  });

  test('should treat a function reading external mutable state as non-deterministic', () => {
    let counter = 0;
    const report = isPureCall(() => ++counter, []);

    expect(report.deterministic).toBe(false);
    expect(report.results).toEqual([1, 2, 3]);
  });
});

describe('memoizePure', () => {
  test('should call the underlying function once for the same args', () => {
    const square = jest.fn((n: number) => n * n);
    const memoized = memoizePure(square);

    expect(memoized(4)).toBe(16);
    expect(memoized(4)).toBe(16);
    expect(square).toHaveBeenCalledTimes(1);
  });

  test('should call the underlying function again for different args', () => {
    const add = jest.fn((a: number, b: number) => a + b);
    const memoized = memoizePure(add);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(2, 1)).toBe(3);
    expect(add).toHaveBeenCalledTimes(2);
  });

  test('should cache an undefined result', () => {
    const noop = jest.fn((_n: number) => undefined);
    const memoized = memoizePure(noop);

    memoized(1);
    memoized(1);

    expect(noop).toHaveBeenCalledTimes(1);
  });

  test('should forward this to the underlying function', () => {
    const obj = {
      factor: 3,
      scale: memoizePure(function (this: { factor: number }, n: number) {
        return this.factor * n;
      }),
    };

    expect(obj.scale(2)).toBe(6);
  });
});
