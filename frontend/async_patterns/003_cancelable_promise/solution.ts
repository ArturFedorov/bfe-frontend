/**
 * Reference solution for 003 — cancelable promise.
 *
 * A native promise cannot be canceled, so we wrap it: the returned `promise`
 * settles with whichever happens FIRST — the original settling, or `cancel()`.
 * `cancel()` after settlement is a natural no-op because a promise's
 * resolve/reject functions ignore every call after the first.
 *
 * Note: the ORIGINAL promise keeps running; cancel only detaches the consumer.
 */
export function makeCancelable<T>(promise: Promise<T>): {
  promise: Promise<T>;
  cancel: () => void;
} {
  // The executor runs synchronously, so `rejectWrapper` is assigned before
  // `cancel` can ever be invoked (hence the definite-assignment `!`).
  let rejectWrapper!: (reason: unknown) => void;

  const wrapper = new Promise<T>((resolve, reject) => {
    rejectWrapper = reject;
    // Pass the original's outcome through untouched.
    promise.then(resolve, reject);
  });

  return {
    promise: wrapper,
    cancel: () => rejectWrapper(new Error('Canceled')),
  };
}
