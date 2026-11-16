export function myReduce<T, U>(
  arr: T[],
  callback: (accumulator: U, value: T, index: number, array: T[]) => U,
  initialValue?: U,
): U {
  const hasInitial = arguments.length >= 3;

  let index = 0;
  let accumulator: U;

  if (hasInitial) {
    accumulator = initialValue as U;
  } else {
    while (index < arr.length && !(index in arr)) index++;
    if (index >= arr.length) {
      throw new TypeError('Reduce of empty array with no initial value');
    }

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
