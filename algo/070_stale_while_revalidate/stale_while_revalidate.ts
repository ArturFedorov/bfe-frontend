export function staleWhileRevalidate<T>(
  fetcher: (key: string) => Promise<T>
): (key: string) => Promise<T> {
  // TODO: implement
  throw new Error('Not implemented');
}
