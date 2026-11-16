export function myFind<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => boolean,
): T | undefined {
  const index = myFindIndex(arr, callback);

  if (index !== -1) {
    return arr[index];
  }

  return undefined;
}

export function myFindIndex<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => boolean,
): number {
  let result: number = -1;

  for (let i = 0; i < arr.length; i++) {
    if (i in arr && callback(arr[i], i, arr)) {
      result = i;
      break;
    }
  }

  return result;
}
