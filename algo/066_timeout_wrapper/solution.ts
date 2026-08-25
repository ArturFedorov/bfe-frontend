export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError());
    }, ms);

    promise
      .then((data) => {
        resolve(data);
        clearTimeout(timer);
      })
      .catch((e) => {
        reject(e);
        clearTimeout(timer);
      });
  });
}
