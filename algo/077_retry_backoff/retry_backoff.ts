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
export function retry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  // TODO: implement
  throw new Error('Not implemented');
}
