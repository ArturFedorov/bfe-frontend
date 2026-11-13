/**
 * setInterval built from chained setTimeouts.
 *
 * Each tick runs the callback and then schedules the next tick. Because the
 * next timeout is only armed after the callback finishes, slow callbacks don't
 * pile up the way native setInterval can.
 *
 * `clear()` flips a flag AND cancels the pending timeout. The flag alone
 * would still let one more queued tick run; cancelling alone would race with
 * a tick that's mid-callback and about to re-arm. Both together are airtight.
 */
export function mySetInterval(
  callback: (...args: any[]) => void,
  delay: number,
  ...args: any[]
): { clear: () => void } {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let cleared = false;

  const tick = (): void => {
    timerId = setTimeout(() => {
      if (cleared) return;
      callback(...args);
      if (!cleared) tick();
    }, delay);
  };

  tick();

  return {
    clear() {
      cleared = true;
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    },
  };
}
