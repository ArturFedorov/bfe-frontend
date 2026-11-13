/**
 * Reference solution for 009 — batch requests.
 *
 * Split `items` into chunks of `batchSize`, hand each chunk to `fn`
 * (one request per chunk), and flatten the per-chunk results back into a
 * single array in input order.
 *
 * Batches are processed SEQUENTIALLY: the next request starts only after the
 * previous one resolved. That is the point of batching — to limit load on the
 * backend. (Running all batches with Promise.all would be trivial but would
 * issue every request at once.)
 */
export async function batchRequests<T, R>(
  items: T[],
  batchSize: number,
  fn: (batch: T[]) => Promise<R[]>,
): Promise<R[]> {
  const results: R[] = [];

  // `slice` clamps the end index, so the last (partial) batch needs no
  // special case; an empty `items` never enters the loop, so `fn` is not called.
  for (let start = 0; start < items.length; start += batchSize) {
    const batch = items.slice(start, start + batchSize);
    const batchResults = await fn(batch);
    results.push(...batchResults);
  }

  return results;
}
