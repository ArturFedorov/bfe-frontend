/**
 * Reference solution for 006 — deferred (externally-settled promise).
 *
 * A promise normally settles from INSIDE its executor. A "deferred" lifts the
 * resolve/reject functions out so other code can settle it later — handy for
 * bridging callbacks/events into promise land. This is what
 * `Promise.withResolvers()` (ES2024) does natively.
 *
 * Duplicate `resolve`/`reject` calls are ignored by the promise itself: only
 * the first settlement counts.
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
} {
  // The executor runs synchronously inside `new Promise`, so both are
  // assigned before we return (hence the definite-assignment `!`).
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
