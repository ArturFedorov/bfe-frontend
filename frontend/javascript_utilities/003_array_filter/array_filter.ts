export function myFilter<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => boolean,
): T[] {
  const results: T[] = [];

  for (let i = 0; i < arr.length; i++) {
    if (i in arr && callback(arr[i], i, arr)) {
      results.push(arr[i]);
    }
  }

  return results;
}
