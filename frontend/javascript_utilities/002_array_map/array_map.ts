export function myMap<T, U>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => U,
): U[] {
  const results = new Array<U>(arr.length);

  for (let i = 0; i < arr.length; i++) {
    if (i in arr) {
      results[i] = callback(arr[i], i, arr);
    }
  }

  return results;
}
