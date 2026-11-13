/**
 * Reference solution for 004 — Array.prototype.reduce from scratch.
 *
 * Semantics mirrored from the spec:
 * - With an initial value, iteration starts at index 0.
 * - Without one, the first present element seeds the accumulator and
 *   iteration starts after it.
 * - Reducing an empty array without an initial value throws a TypeError.
 * - Holes in sparse arrays are skipped.
 */
export function myReduce<T, U>(
  arr: T[],
  callback: (accumulator: U, value: T, index: number, array: T[]) => U,
  initialValue?: U,
): U {
  // `arguments.length` (not `initialValue === undefined`) distinguishes
  // "no initial value" from an explicit `undefined` initial value, like native.
  // eslint-disable-next-line prefer-rest-params
  const hasInitial = arguments.length >= 3;

  let index = 0;
  let accumulator: U;

  if (hasInitial) {
    accumulator = initialValue as U;
  } else {
    // Find the first present element to seed the accumulator.
    while (index < arr.length && !(index in arr)) index++;
    if (index >= arr.length) {
      throw new TypeError('Reduce of empty array with no initial value');
    }
    // Without an initial value the accumulator type is the element type.
    accumulator = arr[index] as unknown as U;
    index++;
  }

  for (; index < arr.length; index++) {
    if (index in arr) {
      accumulator = callback(accumulator, arr[index], index, arr);
    }
  }

  return accumulator;
}
