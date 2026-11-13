/**
 * Reference solution for 010 — promisify.
 *
 * Convert a Node-style function `fn(...args, callback(err, result))` into one
 * that returns a Promise. The wrapper appends its own callback as the last
 * argument and maps `err` → reject, `result` → resolve.
 *
 * `this` is forwarded with `fn.call(this, ...)` so methods keep their receiver
 * when the promisified version is invoked as `wrapped.call(obj)`.
 */
type NodeCallback<T> = (error: unknown, result?: T) => void;

export function promisify<T>(
  fn: (...args: any[]) => void,
): (...args: any[]) => Promise<T> {
  // A regular `function` (not an arrow) so that `this` is the call-site receiver.
  return function (this: any, ...args): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const callback: NodeCallback<T> = (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as T);
        }
      };

      // A synchronous throw inside `fn` must become a rejection, not escape.
      try {
        fn.call(this, ...args, callback);
      } catch (error) {
        reject(error);
      }
    });
  };
}
