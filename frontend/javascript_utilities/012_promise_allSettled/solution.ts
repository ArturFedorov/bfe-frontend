/**
 * Reference solution for 012 — Promise.allSettled from scratch.
 *
 * Never rejects. Waits for every input to settle and resolves with an array
 * of `{ status, value | reason }` records in INPUT order.
 */
type SettledResult<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: any };

export function promiseAllSettled<T>(
  promises: (T | Promise<T>)[],
): Promise<
  Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: any }>
> {
  return new Promise((resolve) => {
    const results: SettledResult<T>[] = new Array(promises.length);
    let remaining = promises.length;

    if (remaining === 0) {
      resolve(results);
      return;
    }

    // Record one outcome at its index; resolve once every slot is filled.
    const settle = (index: number, outcome: SettledResult<T>) => {
      results[index] = outcome;
      if (--remaining === 0) resolve(results);
    };

    promises.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => settle(index, { status: 'fulfilled', value }),
        (reason) => settle(index, { status: 'rejected', reason }),
      );
    });
  });
}
