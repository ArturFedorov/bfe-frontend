export function makeCancelable<T>(promise: Promise<T>): {
  promise: Promise<T>;
  cancel: () => void;
} {
  let reject!: (reason: any) => void;

  const wrapper = new Promise<T>((res, rej) => {
    reject = rej;
    promise.then(res, rej);
  });

  return { promise: wrapper, cancel: () => reject(new Error('Canceled')) };
}
