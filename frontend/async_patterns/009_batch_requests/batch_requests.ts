export function batchRequests<T, R>(items: T[], batchSize: number, fn: (batch: T[]) => Promise<R[]>): Promise<R[]> {
  return new Promise(() => {});
}
