/**
 * Caches the result of `fn` keyed by its arguments.
 *
 * - Without `keyFn`, the key is `JSON.stringify(args)`, so `(1, 2)` and `(2, 1)`
 *   are distinct entries.
 * - `cache.has` (not `cache.get !== undefined`) guards the lookup so cached
 *   `undefined` results are honored.
 * - `this` is forwarded so memoized methods keep working.
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string,
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result: ReturnType<T> = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}
