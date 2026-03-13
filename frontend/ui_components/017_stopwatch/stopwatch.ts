export interface Stopwatch {
  start: () => void;
  stop: () => void;
  reset: () => void;
  lap: () => void;
  getElapsed: () => number;
  getLaps: () => number[];
  isRunning: () => boolean;
}

export function createStopwatch(): Stopwatch {
  return {
    start() {},
    stop() {},
    reset() {},
    lap() {},
    getElapsed: () => 0,
    getLaps: () => [],
    isRunning: () => false,
  };
}
