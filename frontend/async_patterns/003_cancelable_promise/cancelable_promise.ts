export function makeCancelable<T>(promise: Promise<T>): {
  promise: Promise<T>;
  cancel: () => void;
} {
  return { promise: new Promise(() => {}), cancel() {} };
}
