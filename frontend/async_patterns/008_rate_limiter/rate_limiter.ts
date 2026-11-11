export function createRateLimiter(
  maxTokens: number,
  refillRate: number,
): {
  acquire: () => Promise<void>;
} {
  const intervalMs = 1000 / refillRate;
  let tokens = maxTokens;
  let lastRefill = Date.now();
  const waiters: Array<() => void> = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  const refill = () => {
    const now = Date.now();
    const earned = Math.floor((now - lastRefill) / intervalMs);
    if (earned <= 0) return;
    tokens = Math.min(maxTokens, tokens + earned);

    lastRefill = tokens === maxTokens ? now : lastRefill + earned * intervalMs;
  };

  const drain = () => {
    refill();
    while (tokens > 0 && waiters.length > 0) {
      tokens -= 1;
      waiters.shift()!();
    }

    if (waiters.length > 0) scheduleWakeUp();
  };

  const scheduleWakeUp = () => {
    if (timer !== null) return;
    const delay = Math.max(0, lastRefill + intervalMs - Date.now());
    timer = setTimeout(() => {
      timer = null;
      drain();
    }, delay);
  };

  return {
    acquire: () =>
      new Promise((resolve) => {
        refill();

        if (tokens > 0 && waiters.length === 0) {
          tokens -= 1;
          resolve();
          return;
        }

        waiters.push(resolve);
        scheduleWakeUp();
      }),
  };
}
