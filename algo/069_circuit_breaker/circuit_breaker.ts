export class CircuitOpenError extends Error {
  constructor(message = 'Circuit is open') {
    super(message);
    this.name = 'CircuitOpenError';
    Object.setPrototypeOf(this, CircuitOpenError.prototype);
  }
}

export interface CircuitBreakerOptions {
  /** Number of consecutive failures that opens the circuit. */
  failureThreshold: number;
  /** How long the circuit stays open before allowing a half-open probe. */
  cooldownMs: number;
  /** Injectable clock; defaults to Date.now. */
  now?: () => number;
}

export class CircuitBreaker {
  private now: () => number;
  private consecutiveFailures: number = 0;
  private cooldownMs: number;
  private failureThreshold: number;
  private openedAt: number | null = null;

  constructor(options: CircuitBreakerOptions) {
    this.now = options.now ?? Date.now;
    this.failureThreshold = options.failureThreshold || 0;
    this.cooldownMs = options.cooldownMs;
  }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (this.openedAt !== null) {
      if (this.now() - this.openedAt < this.cooldownMs) {
        throw new CircuitOpenError();
      }

      try {
        const result = await fn();
        this.openedAt = null;
        this.consecutiveFailures = 0;
        return result;
      } catch (err) {
        this.openedAt = this.now();
        throw err;
      }
    }

    try {
      const result = await fn();
      this.consecutiveFailures = 0;
      return result;
    } catch (err) {
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= this.failureThreshold) {
        this.openedAt = this.now();
      }

      throw err;
    }
  }
}
