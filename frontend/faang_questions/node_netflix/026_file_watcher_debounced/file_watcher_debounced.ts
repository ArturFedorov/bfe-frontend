/**
 * Build the debounce primitive at the heart of a file watcher: coalesce a burst
 * of change events into a single trailing call after `wait` ms of quiet.
 * The debounced function should pass through the LAST arguments it received.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let timer: NodeJS.Timeout | null = null;
  return function (this: any, ...args: any) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.call(this, ...args);
    }, wait);
  };
}
