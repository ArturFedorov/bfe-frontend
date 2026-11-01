export type Logger = (message: string) => void;

const warned = new Set<string>();

/**
 * Wrap `fn` so that the first call logs a deprecation `message` (once per unique
 * message), then delegates to `fn`. `logger` defaults to `console.warn`.
 */
export function deprecate<F extends (...args: any[]) => any>(
  fn: F,
  message: string,
  logger?: Logger,
): F {
  return function (this: any, ...args: Parameters<F>) {
    if (!warned.has(message)) {
      warned.add(message);
      if (logger) {
        logger(message);
      } else {
        console.warn(message);
      }
    }

    return fn.apply(this, args);
  } as F;
}

/** Clear the record of already-warned messages. */
export function reset(): void {
  warned.clear();
}
