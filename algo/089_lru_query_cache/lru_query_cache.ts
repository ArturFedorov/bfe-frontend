export interface LruCacheOptions {
  /** Maximum number of entries; must be >= 1. */
  max: number;
  /** Time-to-live per entry in ms; omitted means entries never expire. */
  ttlMs?: number;
  /** Clock used for TTL checks; defaults to Date.now. */
  now?: () => number;
}

export interface LruCache<K, V> {
  /** Cached value or undefined. A hit refreshes recency. Expired entries are swept and miss. */
  get(key: K): V | undefined;
  /** Insert or update (update refreshes recency). Evicts the LRU entry when inserting past `max`. */
  set(key: K, value: V): void;
  /** True for a live entry. Does NOT refresh recency. Expired entries are swept and report false. */
  has(key: K): boolean;
  /** Removes the entry; returns whether it existed. */
  delete(key: K): boolean;
  /** Number of stored entries. */
  readonly size: number;
  /**
   * Cached value if present; otherwise calls `loader` once, dedupes concurrent
   * calls for the same key while pending, caches on success, does not cache on
   * failure (the next call retries).
   */
  getOrLoad(key: K, loader: () => Promise<V>): Promise<V>;
}

/**
 * An O(1) LRU cache with lazy TTL expiry and request deduplication, built on
 * a single Map's insertion order (delete + set = move to most-recently-used).
 * Throws RangeError when `max < 1`.
 */
export function createLruCache<K, V>(options: LruCacheOptions): LruCache<K, V> {
  // TODO: implement
  throw new Error('Not implemented');
}
