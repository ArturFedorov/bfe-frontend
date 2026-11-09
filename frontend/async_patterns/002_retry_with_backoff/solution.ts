/**
 * Reference solution for 002 — keep retry_with_backoff.ts as your own attempt;
 * this file is for comparison afterwards.
 */
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function attemptLoop<T>(
  fn: () => Promise<T>,
  retries: number,
  initialDelay: number,
  factor: number,
): Promise<T> {
  let delay = initialDelay;
  // attempt 0 is the first call; `retries` more are allowed after it.
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries) throw error; // budget spent: surface the LAST error
      await sleep(delay); // wait before the next attempt
      delay *= factor; // 100 → 200 → 400 … (or × custom factor)
    }
  }
}

export function retry<T>(
  fn: () => Promise<T>,
  options: { retries: number; initialDelay: number; factor?: number },
): Promise<T> {
  const { retries, initialDelay, factor = 2 } = options;
  const result = attemptLoop(fn, retries, initialDelay, factor);
  // The final rejection can land while the caller is still awaiting a timer
  // (fake timers yield to the real event loop between ticks). Attaching a
  // no-op handler marks it "handled" so Node does not report it as an
  // unhandled rejection; the caller's own `.catch`/`await` still sees it.
  result.catch(() => undefined);
  return result;
}
