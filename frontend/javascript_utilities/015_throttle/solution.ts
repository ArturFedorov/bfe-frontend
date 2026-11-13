/**
 * Reference solution for 015 — throttle with leading/trailing options.
 *
 * Guarantees `func` runs at most once per `wait` ms window:
 * - leading  (default true):  the first call in a window fires immediately.
 * - trailing (default true):  if more calls arrive during the window, one
 *   trailing invocation fires at the end of it with the LATEST args/this,
 *   and that invocation starts a fresh window.
 * - If both are false, leading is treated as true (per README), otherwise the
 *   function would never be invoked.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {},
): (...args: Parameters<T>) => void {
  const trailing = options.trailing ?? true;
  const leading = (options.leading ?? true) || !trailing;

  let timer: ReturnType<typeof setTimeout> | null = null;
  // Pending trailing call captured from the most recent throttled() call.
  let pendingArgs: Parameters<T> | null = null;
  let pendingThis: unknown = null;

  // Runs when the current window closes.
  const onWindowEnd = () => {
    timer = null;
    if (trailing && pendingArgs !== null) {
      // Fire the trailing call and open a new window so we still honour
      // "at most once per wait" after it.
      func.apply(pendingThis, pendingArgs);
      pendingArgs = null;
      pendingThis = null;
      timer = setTimeout(onWindowEnd, wait);
    }
  };

  // A `function` (not an arrow) so the caller's `this` is observable.
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer === null) {
      // No active window: this is a leading-edge call.
      if (leading) {
        func.apply(this, args);
      } else {
        // leading: false → defer this call to the trailing edge.
        pendingArgs = args;
        pendingThis = this;
      }
      timer = setTimeout(onWindowEnd, wait);
    } else {
      // Inside a window: remember only the latest call for the trailing edge.
      pendingArgs = args;
      pendingThis = this;
    }
  };
}
