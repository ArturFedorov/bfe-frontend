export function promiseAll<T>(promises: (T | Promise<T>)[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = new Array(promises.length);
    let remaining = promises.length;

    if (remaining === 0) {
      resolve([]);
      return;
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then((result) => {
        results[index] = result;

        if (--remaining === 0) {
          resolve(results);
        }
      }, reject);
    });
  });
}
