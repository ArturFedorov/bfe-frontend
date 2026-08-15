export interface Clock {
  /** Current time in milliseconds. */
  now: () => number;
}

export interface TokenBucketOptions {
  /** Maximum tokens the bucket can hold; it starts full. */
  capacity: number;
  /** Continuous refill rate in tokens per second. */
  refillPerSecond: number;
  /** Injectable clock; defaults to { now: () => Date.now() }. */
  clock?: Clock;
}

/**
 * Token-bucket rate limiter with lazy fractional refill, a synchronous
 * tryAcquire, and a FIFO-fair awaitable acquire.
 */
export class TokenBucket {
  constructor(options: TokenBucketOptions) {
    // TODO: implement
    throw new Error('Not implemented');
  }

  /** Tokens currently available after applying lazy refill (may be fractional). */
  available(): number {
    // TODO: implement
    throw new Error('Not implemented');
  }

  /**
   * Synchronously takes n tokens (default 1) if available; all-or-nothing.
   * Throws RangeError when n > capacity.
   */
  tryAcquire(n?: number): boolean {
    // TODO: implement
    throw new Error('Not implemented');
  }

  /**
   * Resolves once n tokens (default 1) have been taken, waiting for refill
   * if necessary. Waiters are served in FIFO order.
   * Throws RangeError when n > capacity.
   */
  acquire(n?: number): Promise<void> {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
