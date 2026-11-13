/**
 * 066. Timeout Wrapper — reference solution
 *
 * Approach: race the original promise against a single setTimeout. Whichever
 * settles first decides the outcome of the returned promise; the other is
 * harmless because a promise can only settle once. The crucial detail is
 * clearing the timer on BOTH outcomes of the original promise, so no handle
 * lingers after settlement (tests assert `jest.getTimerCount() === 0`).
 *
 * A late settlement of the original after the timeout fired is ignored by
 * construction — `resolve`/`reject` are no-ops on an already-settled promise.
 * We attach the rejection handler via the two-argument `then`, so the
 * original's rejection is observed exactly once and forwarded untouched.
 *
 * Time: O(1) per wrap. Space: O(1) per wrap (one timer handle).
 */

export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
    // Keep `instanceof TimeoutError` working when targeting ES5-style class
    // down-levelling (defensive; harmless on ES2022).
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (reason: unknown) => {
        clearTimeout(timer);
        reject(reason);
      },
    );
  });
}
