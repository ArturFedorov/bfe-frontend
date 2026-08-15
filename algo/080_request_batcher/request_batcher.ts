export interface BatcherOptions {
  /** Flush a batch this many ms after it opens (unless size flushes it first). */
  maxWaitMs: number;
  /** Flush immediately once a batch holds this many unique keys. */
  maxSize: number;
}

/** Bulk endpoint: receives unique keys in first-call order, returns values by key. */
export type BatchFn<K, V> = (keys: K[]) => Promise<Map<K, V>>;

/** Single-key loader returned by createBatcher. */
export type Loader<K, V> = (key: K) => Promise<V>;

/**
 * Collects individual key requests into batches, flushes each batch as one
 * batchFn call (on maxSize unique keys or after maxWaitMs, whichever first),
 * and fans the results back out to every caller by key.
 */
export function createBatcher<K, V>(
  batchFn: BatchFn<K, V>,
  options: BatcherOptions
): Loader<K, V> {
  // TODO: implement
  throw new Error('Not implemented');
}
