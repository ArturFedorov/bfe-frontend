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
  cleanup?: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const finish = (settle: () => void): void => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', onAbort);
      cleanup?.();
      settle();
    };

    function onAbort(): void {
      finish(() => reject(new AbortError()));
    }

    if (signal.aborted) {
      onAbort();
      return;
    }

    signal.addEventListener('abort', onAbort, { once: true });

    let promise: Promise<T>;
    try {
      promise = promiseFactory();
    } catch (error) {
      finish(() => reject(error));
      return;
    }

    return promise.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) => finish(() => reject(error)),
    );
  });
}
