export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: DebounceOptions,
): (...args: Parameters<T>) => void {
  const { leading = false, trailing = true } = options || {};
  let timer: ReturnType<typeof setTimeout> | null = null;

  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  return function (this: any, ...args: Parameters<T>) {
    lastThis = this;
    lastArgs = args;

    const isFirstCall = timer === null;

    clearTimeout(timer as ReturnType<typeof setTimeout>);

    timer = setTimeout(() => {
      if (trailing && lastArgs !== null) {
        func.apply(lastThis, lastArgs);
      }

      timer = null;
      lastArgs = null;
      lastThis = null;
    }, wait);

    if (leading && isFirstCall) {
      func.apply(lastThis, lastArgs);
      lastArgs = null;
    }
  };
}
