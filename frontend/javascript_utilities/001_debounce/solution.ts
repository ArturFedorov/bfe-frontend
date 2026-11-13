/**
 * Reference solution for 001 — debounce with leading/trailing options.
 *
 * - trailing (default true): invoke `fn` once `delay` ms have passed since the
 *   LAST call, with the latest args/this.
 * - leading (default false): invoke immediately on the first call of a burst.
 * - leading + trailing: the trailing call fires only if further calls arrived
 *   after the leading one (so a single call never invokes twice).
 */
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
  // Latest call captured for the trailing edge; null means "nothing pending".
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  // A `function` (not an arrow) so the caller's `this` is observable.
  return function (this: any, ...args: Parameters<T>) {
    lastThis = this;
    lastArgs = args;

    // No timer running → this call starts a new burst.
    const isFirstCall = timer === null;

    // Every call restarts the quiet-period timer.
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
