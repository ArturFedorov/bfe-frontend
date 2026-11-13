/**
 * Wraps `fn` so it runs at most once. The result of the first call is cached
 * and returned for every subsequent call (even with different arguments).
 *
 * Notes:
 * - A boolean flag (not `result !== undefined`) tracks whether `fn` has run,
 *   so functions that legitimately return `undefined` are still called once.
 * - The wrapper is a regular `function` so the caller's `this` is forwarded
 *   to `fn` via `apply`.
 */
export function once<T extends (...args: any[]) => any>(
  fn: T,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let called = false;
  let result: ReturnType<T> | undefined;

  return function (this: any, ...args: Parameters<T>) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
