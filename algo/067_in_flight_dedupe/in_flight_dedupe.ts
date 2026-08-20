export function dedupe<T>(
  fn: (key: string) => Promise<T>,
): (key: string) => Promise<T> {
  const dictionary = new Map<string, Promise<T>>();
  return function (key: string): Promise<T> {
    const existing = dictionary.get(key);

    if (existing) return existing;

    const promise = fn(key).finally(() => dictionary.delete(key));
    dictionary.set(key, promise);

    return promise;
  };
}
