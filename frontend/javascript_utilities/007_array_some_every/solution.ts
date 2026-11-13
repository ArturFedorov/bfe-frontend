/**
 * Reference solution for 007 — Array.prototype.some / every from scratch.
 *
 * `some` is a short-circuiting OR over the predicate (vacuously false for []).
 * `every` is a short-circuiting AND over the predicate (vacuously true for []).
 * Holes in sparse arrays are skipped, matching the native implementations.
 */
export function mySome<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => boolean,
): boolean {
  for (let i = 0; i < arr.length; i++) {
    // Stop at the first truthy result.
    if (i in arr && callback(arr[i], i, arr)) return true;
  }
  return false;
}

export function myEvery<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => boolean,
): boolean {
  for (let i = 0; i < arr.length; i++) {
    // Stop at the first falsy result.
    if (i in arr && !callback(arr[i], i, arr)) return false;
  }
  return true;
}
