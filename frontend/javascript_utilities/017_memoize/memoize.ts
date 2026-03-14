export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string,
): T {
  const cache = new Map<string, any>();

  return function (this: any, ...args: Parameters<T>) {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (!cache.has(key)) {
      cache.set(key, fn.call(this, ...args));
    }

    return cache.get(key);
  } as T;
}
