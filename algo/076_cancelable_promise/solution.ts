/**
 * 076. Cancelable Promise — reference solution
 *
 * Race the factory's promise against the signal's 'abort' event inside one
 * outer Promise. A `settled` flag guards the single `finish` path, so the
 * first outcome wins, cleanup runs exactly once, and the abort listener is
 * removed no matter which side won.
 */
export class AbortError extends Error {
  constructor(message = 'Aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

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

    promise.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) => finish(() => reject(error)),
    );
  });
}
