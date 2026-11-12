/**
 * Test helpers shared by every milestone suite. Not used by the app.
 * (Same `deferred`/`flush` as frontend/faang_questions/react/_helpers/deferred.ts.)
 */

/** A promise with its resolve/reject exposed — drive async code from tests. */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

export function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Let pending microtasks run. Works with fake timers too. */
export async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

/** Silence React's error-boundary / uncaught-render logging for one assertion. */
export function withSilencedConsoleError<T>(fn: () => T): T {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    return fn();
  } finally {
    spy.mockRestore();
  }
}
