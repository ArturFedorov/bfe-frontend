export function staleWhileRevalidate<T>(
  fetcher: (key: string) => Promise<T>,
): (key: string) => Promise<T> {
  const dictionary = new Map<string, { value: T }>();
  const inFlightPromises = new Map<string, Promise<T>>();

  const fetchAndCache = (key: string): Promise<T> => {
    const promise = fetcher(key)
      .then((value) => {
        dictionary.set(key, { value });
        return value;
      })
      .finally(() => {
        inFlightPromises.delete(key);
      });

    inFlightPromises.set(key, promise);
    return promise;
  };

  return function (key: string): Promise<T> {
    const entry = dictionary.get(key);

    if (entry) {
      if (!inFlightPromises.has(key)) {
        fetchAndCache(key).catch(() => {});
      }

      return Promise.resolve(entry.value);
    }

    const pending = inFlightPromises.get(key);
    if (pending) return pending;

    return fetchAndCache(key);
  };
}
