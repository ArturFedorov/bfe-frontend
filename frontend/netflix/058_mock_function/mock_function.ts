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
  // TODO: implement
  throw new Error('Not implemented');
}
