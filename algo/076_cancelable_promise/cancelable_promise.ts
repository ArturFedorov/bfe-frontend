/** Rejection reason used when the signal aborts. Part of the contract. */
export class AbortError extends Error {
  constructor(message = 'Aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

/**
 * Starts the work from promiseFactory and returns a promise that:
 * - settles like the underlying promise, or
 * - rejects with AbortError when signal aborts first.
 * An already-aborted signal rejects immediately without invoking the factory.
 * cleanup (if given) runs exactly once on first settlement of any kind.
 */
export function cancelable<T>(
  promiseFactory: () => Promise<T>,
  signal: AbortSignal,
  cleanup?: () => void
): Promise<T> {
  // TODO: implement
  throw new Error('Not implemented');
}
