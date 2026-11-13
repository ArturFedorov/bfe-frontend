/**
 * Reference solution for 011 — Promise.race from scratch.
 *
 * Settles with the outcome (fulfilment OR rejection) of whichever input
 * settles first. Plain values count as already-fulfilled, so a plain value
 * earlier in the array wins over an already-resolved promise after it,
 * because both settle in the same microtask tick and we wire them in order.
 *
 * Like the native, an empty input stays pending forever.
 */
export function promiseRace<T>(promises: (T | Promise<T>)[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    for (const item of promises) {
      // A promise can only settle once, so the first call to resolve/reject
      // wins and all later ones are no-ops.
      Promise.resolve(item).then(resolve, reject);
    }
  });
}
