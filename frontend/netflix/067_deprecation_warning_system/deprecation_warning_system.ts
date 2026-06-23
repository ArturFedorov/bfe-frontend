export type Logger = (message: string) => void;

/**
 * Wrap `fn` so that the first call logs a deprecation `message` (once per unique
 * message), then delegates to `fn`. `logger` defaults to `console.warn`.
 */
export function deprecate<F extends (...args: any[]) => any>(
  fn: F,
  message: string,
  logger?: Logger,
): F {
  // TODO: implement (warn once per message, then call through)
  throw new Error('Not implemented');
}

/** Clear the record of already-warned messages. */
export function reset(): void {
  // TODO: implement
  throw new Error('Not implemented');
}
