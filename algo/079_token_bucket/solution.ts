/**
 * 079. Token Bucket — reference solution
 *
 * Tokens are refilled lazily: every read first credits
 * `elapsedMs * rate / 1000` tokens (capped at capacity) since the last read.
 * Awaitable `acquire` calls join a FIFO queue; a single timer is armed for
 * exactly the time the head waiter needs, so a large early request is never
 * overtaken by a small later one. `tryAcquire` also refuses while anyone is
 * queued, keeping the line fair.
 */
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

interface Waiter {
  n: number;
  resolve: () => void;
}

export class TokenBucket {
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private readonly clock: Clock;
  private tokens: number;
  private lastRefill: number;
  private readonly waiters: Waiter[] = [];
  private waiterHead = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: TokenBucketOptions) {
    if (!(options.capacity > 0)) {
      throw new RangeError('capacity must be positive');
    }
    if (!(options.refillPerSecond > 0)) {
      throw new RangeError('refillPerSecond must be positive');
    }
    this.capacity = options.capacity;
    this.refillPerMs = options.refillPerSecond / 1000;
    this.clock = options.clock ?? { now: () => Date.now() };
    this.tokens = options.capacity;
    this.lastRefill = this.clock.now();
  }

  available(): number {
    this.refill();
    return this.tokens;
  }

  tryAcquire(n = 1): boolean {
    this.validate(n);
    if (this.queueLength() > 0) return false;
    return this.take(n);
  }

  acquire(n = 1): Promise<void> {
    this.validate(n);
    if (this.queueLength() === 0 && this.take(n)) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.waiters.push({ n, resolve });
      this.schedule();
    });
  }

  private refill(): void {
    const now = this.clock.now();
    const elapsed = now - this.lastRefill;
    if (elapsed > 0) {
      this.tokens = Math.min(
        this.capacity,
        this.tokens + elapsed * this.refillPerMs,
      );
      this.lastRefill = now;
    }
  }

  private take(n: number): boolean {
    this.refill();
    if (this.tokens < n) return false;
    this.tokens -= n;
    return true;
  }

  private validate(n: number): void {
    if (!(n > 0)) {
      throw new RangeError(`n must be positive, got ${n}`);
    }
    if (n > this.capacity) {
      throw new RangeError(`n (${n}) exceeds capacity (${this.capacity})`);
    }
  }

  private queueLength(): number {
    return this.waiters.length - this.waiterHead;
  }

  private drain(): void {
    this.timer = null;
    while (this.queueLength() > 0) {
      const head = this.waiters[this.waiterHead];
      if (!this.take(head.n)) break;
      this.waiterHead++;
      head.resolve();
    }
    if (this.queueLength() === 0) {
      this.waiters.length = 0;
      this.waiterHead = 0;
    } else {
      this.schedule();
    }
  }

  private schedule(): void {
    if (this.timer !== null || this.queueLength() === 0) return;
    this.refill();
    const deficit = this.waiters[this.waiterHead].n - this.tokens;
    const delay = Math.max(1, Math.ceil(deficit / this.refillPerMs));
    this.timer = setTimeout(() => this.drain(), delay);
  }
}
