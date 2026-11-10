type NodeCallback<T> = (error: unknown, result?: T) => void;

export function promisify<T>(
  fn: (...args: any[]) => void,
): (...args: any[]) => Promise<T> {
  return function (this: any, ...args): Promise<T> {
    return new Promise((resolve, reject) => {
      const callback: NodeCallback<T> = (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as T);
        }
      };

      try {
        fn.call(this, ...args, callback);
      } catch (error) {
        reject(error);
      }
    });
  };
}
