/**
 * Splits `arr` into consecutive groups of `size`; the last group may be
 * shorter. `size` must be a positive integer.
 *
 * `slice` clamps its end index, so no special case is needed for the tail.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`chunk size must be a positive integer, got ${size}`);
  }

  const result: T[][] = [];

  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }

  return result;
}

/**
 * Pairs elements by index. The output length is that of the shortest input,
 * so nothing is ever `undefined` by truncation.
 *
 * `Math.min()` with no arguments is `Infinity`, hence the explicit guard.
 */
export function zip<A, B>(a: A[], b: B[]): [A, B][];
export function zip<A, B, C>(a: A[], b: B[], c: C[]): [A, B, C][];
export function zip(...arrays: unknown[][]): unknown[][];
export function zip(...arrays: unknown[][]): unknown[][] {
  if (arrays.length === 0) {
    return [];
  }

  const length = Math.min(...arrays.map((arr) => arr.length));

  return Array.from({ length }, (_, i) => arrays.map((arr) => arr[i]));
}

/**
 * Inverse of `zip`: a list of tuples becomes one array per tuple position.
 * Transposing is its own inverse, so this is just `zip` spread over the rows.
 */
export function unzip<A, B>(tuples: [A, B][]): [A[], B[]];
export function unzip<A, B, C>(tuples: [A, B, C][]): [A[], B[], C[]];
export function unzip(tuples: unknown[][]): unknown[][];
export function unzip(tuples: unknown[][]): unknown[][] {
  return zip(...tuples);
}
