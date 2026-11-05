type SettledResult<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: any };

export function promiseAllSettled<T>(
  promises: (T | Promise<T>)[],
): Promise<Array<SettledResult<T>>> {
  if (promises.length === 0) {
    return Promise.resolve([]);
  }

  return new Promise<Array<SettledResult<T>>>((resolve, _) => {
    let settled = 0;
    const results: Array<SettledResult<T>> = [];

    const settle = (i: number, result: SettledResult<T>) => {
      results[i] = result;
      if (++settled === promises.length) resolve(results);
    };
    promises.forEach((p, i) =>
      Promise.resolve(p).then(
        (value) => settle(i, { status: 'fulfilled', value }),
        (reason: unknown) => settle(i, { status: 'rejected', reason }),
      ),
    );
  });
}
