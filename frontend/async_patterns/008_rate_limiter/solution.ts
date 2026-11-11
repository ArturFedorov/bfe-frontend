export function createRateLimiter(
  maxTokens: number,
  refillRate: number, // tokens per second
): { acquire: () => Promise<void> } {
  const intervalMs = 1000 / refillRate; // time to earn one token
  let tokens = maxTokens; // bucket starts full
  let lastRefill = Date.now(); // when the bucket was last brought up to date
  const waiters: Array<() => void> = []; // FIFO queue of blocked acquire() calls
  let timer: ReturnType<typeof setTimeout> | null = null;

  // Lazy refill: tokens are not ticked in by an interval, they are computed
  // from elapsed time whenever someone looks. No timer runs while idle.
  const refill = () => {
    const now = Date.now();
    const earned = Math.floor((now - lastRefill) / intervalMs);
    if (earned <= 0) return;
    tokens = Math.min(maxTokens, tokens + earned);
    // A full bucket does not bank extra time; otherwise advance by whole tokens
    // so fractional progress toward the next token is kept.
    lastRefill = tokens === maxTokens ? now : lastRefill + earned * intervalMs;
  };

  // Hand tokens to waiters in arrival order; if any remain, wake up for the next token.
  const drain = () => {
    refill();
    while (tokens > 0 && waiters.length > 0) {
      tokens -= 1;
      waiters.shift()!();
    }
    if (waiters.length > 0) scheduleWakeUp();
  };

  const scheduleWakeUp = () => {
    if (timer !== null) return; // one timer at a time
    const delay = Math.max(0, lastRefill + intervalMs - Date.now());
    timer = setTimeout(() => {
      timer = null;
      drain();
    }, delay);
  };

  return {
    acquire: () =>
      new Promise<void>((resolve) => {
        refill();
        // Fast path only when nobody is ahead in the queue — otherwise FIFO breaks.
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
