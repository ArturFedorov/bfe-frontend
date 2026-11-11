export async function batchRequests<T, R>(
  items: T[],
  batchSize: number,
  fn: (batch: T[]) => Promise<R[]>,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const data = await fn(items.slice(i, i + batchSize));
    results.push(...data);
  }

  return results;
}
