type RejectCallback = (error: any) => void;

export function makeCancelable<T>(promise: Promise<T>): {
  promise: Promise<T>;
  cancel: () => void;
} {
  let cancel: () => void = () => {};

  const wrapper = new Promise<T>((resolve, reject) => {
    cancel = () => reject(new Error('Canceled'));
    promise.then(resolve, reject);
  });

  return { promise: wrapper, cancel };
}
