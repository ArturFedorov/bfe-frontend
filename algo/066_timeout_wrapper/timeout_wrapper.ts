export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  // TODO: implement
  throw new Error('Not implemented');
}
