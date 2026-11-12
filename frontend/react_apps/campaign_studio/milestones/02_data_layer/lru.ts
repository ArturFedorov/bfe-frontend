/**
 * Milestone 2a — LRU cache with TTL and request de-duplication.
 * See README.md in this folder. Tests: lru.test.ts.
 */

export interface LruCacheOptions {
  /** Maximum number of entries. Inserting beyond it evicts the least recently used. */
  max: number;
  /** Entries older than this (since set) are treated as missing. Omit for no expiry. */
  ttlMs?: number;
  /** Clock, injectable for tests. Default `Date.now`. */
  now?: () => number;
}

export interface LruCache<K, V> {
  /** Returns the value and marks the key as most recently used; `undefined` when missing or expired. */
  get(key: K): V | undefined;
  /** Inserts or replaces, marks as most recently used, evicts the LRU entry when over `max`. */
  set(key: K, value: V): void;
  /** True when present and not expired. Does not touch recency. */
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  /** Live (non-expired) entry count. */
  readonly size: number;
  /** Keys from least recently used to most recently used, expired ones excluded. */
  keys(): K[];
  /**
   * Cached value if present; otherwise calls `loader(key)` once, caches the
   * resolved value and returns it. Concurrent calls for the same key while a
   * load is in flight share that one promise. A rejected load is not cached
   * and the rejection propagates to every waiter.
   */
  getOrLoad(key: K, loader: (key: K) => Promise<V>): Promise<V>;
}

export function createLruCache<K, V>(options: LruCacheOptions): LruCache<K, V> {
  void options;
  throw new Error('Not implemented');
}
