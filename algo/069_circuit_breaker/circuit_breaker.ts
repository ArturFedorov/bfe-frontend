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
  constructor(options: CircuitBreakerOptions) {
    // TODO: implement
    throw new Error('Not implemented');
  }

  exec<T>(fn: () => Promise<T>): Promise<T> {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
