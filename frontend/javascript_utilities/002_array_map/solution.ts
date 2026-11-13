/**
 * Reference solution for 002 — Array.prototype.map from scratch.
 *
 * Mirrors the native semantics: the callback receives (value, index, array),
 * the result has the same length as the input, and holes in sparse arrays are
 * skipped (the callback is not invoked for them and the hole is preserved).
 */
export function myMap<T, U>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => U,
): U[] {
  // Pre-size the output so sparse inputs keep their length even if we skip holes.
  const result: U[] = new Array(arr.length);

  for (let i = 0; i < arr.length; i++) {
    // `i in arr` is false for holes in sparse arrays — native map skips those.
    if (i in arr) {
      result[i] = callback(arr[i], i, arr);
    }
  }

  return result;
}
