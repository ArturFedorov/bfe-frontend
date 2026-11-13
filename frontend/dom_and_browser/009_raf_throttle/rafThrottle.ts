export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T,
): (...args: Parameters<T>) => void {
  let pending = false;
  let lastArgs: Parameters<T>;
  let lastThis: unknown;

  return function (this: any, ...args: Parameters<T>): void {
    lastArgs = args;
    lastThis = this;

    if (pending) return;

    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      fn.apply(lastThis, lastArgs);
    });
  };
}
