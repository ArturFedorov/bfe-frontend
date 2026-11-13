export function promiseAny<T>(promises: (T | Promise<T>)[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const errors: unknown[] = [];
    let remaining = promises.length;

    if (remaining === 0) {
      reject(new AggregateError([], 'All promises were rejected'));
      return;
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(resolve, (error: unknown) => {
        errors[index] = error;
        if (--remaining === 0) {
          reject(new AggregateError(errors, 'All promises were rejected'));
        }
      });
    });
  });
}
