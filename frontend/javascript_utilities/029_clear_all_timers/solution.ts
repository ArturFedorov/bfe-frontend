/**
 * A timer manager that wraps the native timers and remembers every active id
 * so they can all be cancelled with one `clearAll()` call.
 *
 * - Timeouts remove themselves from the set once they fire, so `clearAll`
 *   doesn't waste calls clearing already-finished timers.
 * - Intervals stay tracked until cleared.
 * - Ids are returned as numbers (matching the browser API). In Node the
 *   native timers return `Timeout` objects, so we keep a parallel `Map` from
 *   our numeric id to the native handle and clear via that handle.
 */
export function createTimerManager(): {
  setTimeout: (callback: () => void, delay: number) => number;
  setInterval: (callback: () => void, delay: number) => number;
  clearAll: () => void;
} {
  let nextId = 1;
  const timeouts = new Map<number, ReturnType<typeof setTimeout>>();
  const intervals = new Map<number, ReturnType<typeof setInterval>>();

  return {
    setTimeout(callback, delay) {
      const id = nextId++;
      const handle = setTimeout(() => {
        timeouts.delete(id); // completed naturally; nothing left to cancel
        callback();
      }, delay);
      timeouts.set(id, handle);
      return id;
    },

    setInterval(callback, delay) {
      const id = nextId++;
      const handle = setInterval(callback, delay);
      intervals.set(id, handle);
      return id;
    },

    clearAll() {
      for (const handle of timeouts.values()) clearTimeout(handle);
      for (const handle of intervals.values()) clearInterval(handle);
      timeouts.clear();
      intervals.clear();
    },
  };
}
