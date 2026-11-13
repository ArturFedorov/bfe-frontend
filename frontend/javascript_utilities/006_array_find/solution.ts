/**
 * Reference solution for 006 — Array.prototype.find / findIndex from scratch.
 *
 * Both iterate left to right and short-circuit on the first match. Unlike
 * map/filter, the native find/findIndex visit holes too (as `undefined`), so
 * we do not skip them here.
 */
export function myFind<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => boolean,
): T | undefined {
  for (let i = 0; i < arr.length; i++) {
    if (callback(arr[i], i, arr)) return arr[i];
  }
  return undefined;
}

export function myFindIndex<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => boolean,
): number {
  for (let i = 0; i < arr.length; i++) {
    if (callback(arr[i], i, arr)) return i;
  }
  return -1;
}
