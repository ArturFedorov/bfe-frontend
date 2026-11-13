type SettledResult<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: any };

export function promiseAllSettled<T>(
  promises: (T | Promise<T>)[],
): Promise<Array<SettledResult<T>>> {
  return new Promise((resolve, reject) => {
    const results: SettledResult<T>[] = [];
    let remaining = promises.length;

    if (remaining === 0) {
      resolve([]);
      return;
    }

    const settle = (index: number, outcome: SettledResult<T>) => {
      results[index] = outcome;
      if (--remaining === 0) resolve(results);
    };

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(
        (value) => settle(index, { status: 'fulfilled', value }),
        (reason) => settle(index, { status: 'rejected', reason }),
      );
    });
  });
}
