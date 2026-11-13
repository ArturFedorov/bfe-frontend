/**
 * Reference solution for 013 — Promise.any from scratch.
 *
 * Resolves with the first input to FULFIL. Rejects only if every input
 * rejects, with an AggregateError whose `errors` array lists each rejection
 * reason in INPUT order (not rejection order). Empty input rejects
 * immediately with an AggregateError holding an empty errors array.
 */
export function promiseAny<T>(promises: (T | Promise<T>)[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const errors: any[] = new Array(promises.length);
    let remaining = promises.length;

    if (remaining === 0) {
      reject(new AggregateError([], 'All promises were rejected'));
      return;
    }

    promises.forEach((item, index) => {
      Promise.resolve(item).then(
        // First fulfilment wins; later ones are no-ops on a settled promise.
        resolve,
        (reason) => {
          errors[index] = reason; // keep input order
          if (--remaining === 0) {
            reject(new AggregateError(errors, 'All promises were rejected'));
          }
        },
      );
    });
  });
}
