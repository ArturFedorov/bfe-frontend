/**
 * Reference solution for 003 — Array.prototype.filter from scratch.
 *
 * Returns a new dense array containing only the elements for which the
 * predicate returned a truthy value. Holes in sparse arrays are skipped,
 * exactly like the native implementation.
 */
export function myFilter<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => boolean,
): T[] {
  const result: T[] = [];

  for (let i = 0; i < arr.length; i++) {
    // Skip holes: native filter never calls the predicate for them.
    if (i in arr && callback(arr[i], i, arr)) {
      result.push(arr[i]);
    }
  }

  return result;
}
