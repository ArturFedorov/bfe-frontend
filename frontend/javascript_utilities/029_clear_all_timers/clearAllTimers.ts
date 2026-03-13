export function createTimerManager(): {
  setTimeout: (callback: () => void, delay: number) => number;
  setInterval: (callback: () => void, delay: number) => number;
  clearAll: () => void;
} {
  return {
    setTimeout: (cb, delay) => 0,
    setInterval: (cb, delay) => 0,
    clearAll: () => {},
  };
}
