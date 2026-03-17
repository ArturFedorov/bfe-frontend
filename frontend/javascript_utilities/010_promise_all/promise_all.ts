export function promiseAll<T>(promises: (T | Promise<T>)[]): Promise<T[]> {
  if (promises.length === 0) {
    return Promise.resolve([]);
  }

  const verifyPromise = (item: any) =>
    item instanceof Promise ? item : Promise.resolve(item);

  const verifiedPromises = promises.map(verifyPromise);

  return new Promise((resolve, reject) => {
    const results: T[] = new Array(verifiedPromises.length);
    let isError = false;
    let resolved = 0;

    verifiedPromises.forEach((promise, index) => {
      promise.then(
        (value) => {
          if (isError) return;
          results[index] = value;
          resolved++;

          if (resolved === promises.length) {
            resolve(results);
          }
        },
        (error) => {
          if (isError) return;
          isError = true;
          reject(error);
        },
      );
    });
  });
}
