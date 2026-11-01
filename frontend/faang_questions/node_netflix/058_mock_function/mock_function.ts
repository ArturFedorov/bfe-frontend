export interface MockFn<Args extends unknown[] = unknown[], Return = unknown> {
  (...args: Args): Return;
  calls: Args[];
  results: Return[];
  mockReturnValue(value: Return): MockFn<Args, Return>;
  mockImplementation(fn: (...args: Args) => Return): MockFn<Args, Return>;
}

/**
 * Implement a `jest.fn()`-style mock: callable, records every call's args and
 * return value, and supports `mockReturnValue` / `mockImplementation`.
 */
export function fn<Args extends unknown[] = unknown[], Return = unknown>(
  impl?: (...args: Args) => Return,
): MockFn<Args, Return> {
  let implementation = impl || ((() => undefined) as (...args: Args) => Return);

  const mock = function (...args: Args): Return {
    mock.calls.push(args);
    const result = implementation(...args);
    mock.results.push(result);
    return result;
  } as MockFn<Args, Return>;

  mock.calls = [];
  mock.results = [];

  mock.mockReturnValue = function (value: Return): MockFn<Args, Return> {
    implementation = () => value;
    return mock;
  };

  mock.mockImplementation = function (
    fn: (...args: Args) => Return,
  ): MockFn<Args, Return> {
    implementation = fn;
    return mock;
  };

  return mock;
}
