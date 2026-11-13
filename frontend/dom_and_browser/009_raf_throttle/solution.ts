/**
 * Reference solution for 009 — requestAnimationFrame throttle.
 *
 * Collapse a burst of calls into ONE invocation on the next animation frame,
 * using the arguments (and `this`) of the LAST call in the burst. Ideal for
 * scroll/resize/mousemove handlers that only need to paint once per frame.
 *
 * Mechanics: the first call in a frame schedules the rAF and sets `pending`;
 * later calls just overwrite the stored args. When the frame fires we clear
 * `pending` BEFORE invoking `fn`, so a call made from inside `fn` can schedule
 * the next frame rather than being swallowed.
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T,
): (...args: Parameters<T>) => void {
  let pending = false;
  let lastArgs: Parameters<T>;
  let lastThis: unknown;

  // A regular `function` so the caller's `this` (e.g. `obj.throttled()`) is captured.
  return function (this: unknown, ...args: Parameters<T>): void {
    lastArgs = args; // always keep the most recent call
    lastThis = this;

    if (pending) return; // a frame is already booked — nothing more to do

    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      fn.apply(lastThis, lastArgs);
    });
  };
}
