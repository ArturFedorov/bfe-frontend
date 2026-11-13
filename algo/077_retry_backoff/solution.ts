/**
 * 077. Retry with Exponential Backoff — reference solution
 *
 * Approach: a plain `for` loop over attempts 0..retries. Each iteration awaits
 * `fn(attempt)` and returns on success. On failure:
 *   1. a non-retryable error is re-thrown immediately (no further attempts,
 *      no sleep);
 *   2. if this was the last allowed attempt we stop without sleeping and
 *      reject with that final error;
 *   3. otherwise compute the delay for retry `attempt`:
 *        min(baseMs * 2^attempt, maxMs), then optionally full-jitter it with
 *        floor(delay * random()) — jitter is applied AFTER the cap so the
 *        jittered value never exceeds maxMs.
 *      and await the injectable `sleep`.
 *
 * `sleep` and `random` are injected so tests can record the schedule without
 * wall-clock time; the default sleep is setTimeout-based so Jest fake timers
 * drive it.
 *
 * Time: O(retries) attempts. Space: O(1).
 */

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface RetryOptions {
  /** Number of retries after the initial attempt (total attempts = retries + 1). */
  retries: number;
  /** Base delay in ms; retry i (0-based) waits baseMs * 2^i before running. */
  baseMs: number;
  /** Cap applied to every delay. Defaults to no cap. */
  maxMs?: number;
  /** When true, each capped delay becomes floor(delay * random()). Defaults to false. */
  jitter?: boolean;
  /** Retry only errors this predicate accepts. Defaults to retrying every error. */
  isRetryable?: (error: unknown) => boolean;
  /** Injectable sleep. Defaults to a setTimeout-based sleep (fake-timer friendly). */
  sleep?: (ms: number) => Promise<void>;
  /** Injectable RNG for jitter. Defaults to Math.random. */
  random?: () => number;
}

/**
 * Calls fn (passing the 0-based attempt number) and retries failed attempts
 * with capped exponential backoff. Non-retryable errors reject immediately;
 * exhausting retries rejects with the last error.
 */
export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const {
    retries,
    baseMs,
    maxMs = Infinity,
    jitter = false,
    isRetryable = () => true,
    sleep = defaultSleep,
    random = Math.random,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error)) throw error;
      if (attempt === retries) break; // exhausted: no sleep after final failure

      let delay = Math.min(baseMs * 2 ** attempt, maxMs);
      if (jitter) delay = Math.floor(delay * random());
      await sleep(delay);
    }
  }

  throw lastError;
}
