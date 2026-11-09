export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
} {
  let resolve: (value: T) => void = (value: T) => {};
  let reject: (reason?: any) => void = (reason?: any) => {};

  const wrapper = new Promise<T>((res, rej) => {
    reject = rej;
    resolve = res;
  });

  return {
    promise: wrapper,
    resolve,
    reject,
  };
}
