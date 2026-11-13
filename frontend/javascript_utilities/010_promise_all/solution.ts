/**
 * Reference solution for 010 — Promise.all from scratch.
 *
 * Resolves with an array of results in INPUT order once every input has
 * fulfilled; rejects with the first rejection reason. Plain values are
 * treated as already-fulfilled promises.
 */
export function promiseAll<T>(promises: (T | Promise<T>)[]): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    const results: T[] = new Array(promises.length);
    let remaining = promises.length;

    // Empty input resolves immediately with [] (the loop below never runs).
    if (remaining === 0) {
      resolve(results);
      return;
    }

    promises.forEach((item, index) => {
      // Promise.resolve normalises plain values and thenables alike.
      Promise.resolve(item).then(
        (value) => {
          // Store by index so completion order does not affect result order.
          results[index] = value;
          if (--remaining === 0) resolve(results);
        },
        // The outer promise can only settle once, so later rejections are
        // ignored automatically — no explicit "already rejected" flag needed.
        reject,
      );
    });
  });
}
