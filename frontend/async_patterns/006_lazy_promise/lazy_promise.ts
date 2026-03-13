export function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: any) => void } {
  return { promise: new Promise(() => {}), resolve: () => {}, reject: () => {} };
}
