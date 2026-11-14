export function promisify<T>(
  fn: (...args: any[]) => void,
): (...args: any[]) => Promise<T> {
  return function (this: any, ...args): Promise<T> {
    return new Promise((resolve, reject) => {
      const callback = (error: unknown, value: T) => {
        if (error) {
          reject(error);
        } else {
          resolve(value as T);
        }
      };

      try {
        fn.call(this, ...args, callback);
      } catch (err: unknown) {
        reject(err);
      }
    });
  };
}
