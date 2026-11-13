export function once<T extends (...args: any[]) => any>(
  fn: T,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let called = false;
  let result: ReturnType<T> | undefined;

  return function (this: any, ...args: Parameters<T>) {
    if (!called) {
      result = fn.apply(this, args);
      called = true;
    }

    return result;
  };
}
