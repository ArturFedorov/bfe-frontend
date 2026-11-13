export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean },
): (...args: Parameters<T>) => void {
  const trailing = options?.trailing ?? true;
  const leading = (options?.leading ?? true) || !trailing;

  let timer: ReturnType<typeof setTimeout> | null = null;

  let pendingArgs: Parameters<T> | null = null;
  let pendingThis: unknown = null;

  const onWindowEnd = () => {
    timer = null;
    if (trailing && pendingArgs !== null) {
      func.apply(pendingThis, pendingArgs);
      pendingArgs = null;
      pendingThis = null;

      timer = setTimeout(onWindowEnd, wait);
    }
  };

  return function (this: unknown, ...args: Parameters<T>) {
    if (timer === null) {
      if (leading) {
        func.apply(this, args);
      } else {
        pendingThis = this;
        pendingArgs = args;
      }

      timer = setTimeout(onWindowEnd, wait);
    } else {
      pendingThis = this;
      pendingArgs = args;
    }
  };
}
