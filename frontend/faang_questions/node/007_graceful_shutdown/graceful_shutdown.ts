export type ShutdownOutcome = 'drained' | 'forced';

export interface ShutdownTimers {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface ShutdownCoordinatorOptions {
  /** How long onSignal() waits for in-flight work before forcing exit. */
  drainDeadlineMs: number;
  /** Called exactly once if the deadline fires before the drain completes. */
  onForceExit: () => void;
  /** Injectable timer functions; defaults to the globals (fake-timer friendly). */
  timers?: ShutdownTimers;
}

export class ShutdownInProgressError extends Error {
  constructor() {
    super('Shutdown in progress — new work is not accepted');
    this.name = 'ShutdownInProgressError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Coordinates graceful shutdown: tracks in-flight work, and on signal stops
 * accepting new work and drains what is running — resolving 'drained' on a
 * clean drain (deadline timer cleared) or 'forced' (onForceExit called once)
 * when the deadline fires first.
 */
export class ShutdownCoordinator {
  constructor(options: ShutdownCoordinatorOptions) {
    // TODO: implement
    void options;
    throw new Error('Not implemented');
  }

  get inFlightCount(): number {
    // TODO: implement
    throw new Error('Not implemented');
  }

  get isShuttingDown(): boolean {
    // TODO: implement
    throw new Error('Not implemented');
  }

  /**
   * Registers in-flight work. Returns a promise that settles like the input.
   * Rejects immediately with ShutdownInProgressError once a drain has begun
   * (the work is NOT added to the drain set).
   */
  track<T>(work: Promise<T>): Promise<T> {
    // TODO: implement
    void work;
    throw new Error('Not implemented');
  }

  /**
   * Starts the drain (idempotent — repeated calls return the same promise).
   * Resolves 'drained' when the last tracked promise settles, or 'forced'
   * after drainDeadlineMs, in which case onForceExit is called exactly once.
   */
  onSignal(): Promise<ShutdownOutcome> {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
