export function createTimerManager(): {
  setTimeout: (callback: () => void, delay: number) => number;
  setInterval: (callback: () => void, delay: number) => number;
  clearAll: () => void;
} {
  let nextId = 1;
  const timeouts = new Map<number, ReturnType<typeof setTimeout>>();
  const intervals = new Map<number, ReturnType<typeof setInterval>>();

  return {
    setTimeout: (cb, delay) => {
      const id = nextId++;
      const handle = setTimeout(() => {
        timeouts.delete(id);
        cb();
      }, delay);

      timeouts.set(id, handle);

      return id;
    },
    setInterval: (cb, delay) => {
      const id = nextId++;
      const handle = setInterval(cb, delay);
      intervals.set(id, handle);

      return id;
    },
    clearAll: () => {
      for (const handle of timeouts.values()) clearTimeout(handle);
      for (const handle of intervals.values()) clearInterval(handle);

      timeouts.clear();
      intervals.clear();
    },
  };
}
