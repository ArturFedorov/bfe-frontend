export function promiseAny<T>(promises: (T | Promise<T>)[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const errors: Error[] = [];

    if (promises.length === 0) {
      reject(new AggregateError([], 'All promises were rejected'));
    }

    promises.forEach((promise) => {
      Promise.resolve(promise)
        .then(resolve)
        .catch((err: Error) => {
          errors.push(err);

          if (errors.length === promises.length) {
            reject(new AggregateError(errors, 'An error occurred'));
          }
        });
    });
  });
}
