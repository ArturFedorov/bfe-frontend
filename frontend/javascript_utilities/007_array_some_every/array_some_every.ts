export function mySome<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => boolean,
): boolean {
  for (let i = 0; i < arr.length; i++) {
    if (i in arr && callback(arr[i], i, arr)) {
      return true;
    }
  }

  return false;
}

export function myEvery<T>(
  arr: T[],
  callback: (value: T, index: number, array: T[]) => boolean,
): boolean {
  for (let i = 0; i < arr.length; i++) {
    if (i in arr && !callback(arr[i], i, arr)) {
      return false;
    }
  }

  return true;
}
