export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: DebounceOptions = {},
): (...args: Parameters<T>) => void {
  const { leading = false, trailing = true } = options;
  let timer: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  return function (this: any, ...args: Parameters<T>) {
    lastThis = this;
    lastArgs = args;

    const isFirstCall = timer === null;

    clearTimeout(timer as NodeJS.Timeout);
    timer = setTimeout(() => {
      if (trailing && lastArgs !== null) {
        fn.apply(lastThis, lastArgs);
      }
      timer = null;
      lastArgs = null;
      lastThis = null;
    }, delay);

    if (leading && isFirstCall) {
      fn.apply(lastThis, lastArgs);
      lastArgs = null; // signal: no pending trailing call unless more calls arrive
    }
  };
}
