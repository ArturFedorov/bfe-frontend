/**
 * 089. LRU Query Cache — reference solution
 *
 * Storage is ONE `Map<K, Entry>` and recency is its insertion order:
 *   - most-recently-used  = re-insert: `map.delete(k); map.set(k, entry)`
 *   - least-recently-used = the first key the iterator yields
 * Each entry carries `expiresAt` (Infinity without a TTL). Expiry is lazy —
 * `peek(key)` is the single place that checks the clock and sweeps an
 * expired entry, so `get`, `has` and `getOrLoad` all share it. No timers:
 * they keep the process alive and do not scale to many keys.
 *
 *   get     → peek; on a hit re-insert (refresh recency) and return value
 *   has     → peek only (never touches recency)
 *   set     → delete-then-set (so an update is a move, not a growth), THEN
 *             evict the oldest key only if size > max — an update of an
 *             existing key therefore never evicts anything
 *   delete  → Map.delete
 *   size    → Map.size (expired-but-unswept entries still count, by contract)
 *
 * getOrLoad(key, loader)
 *   1. live cached value → resolve with it (and refresh recency like `get`)
 *   2. a load already in flight for this key → return that same promise
 *   3. otherwise call `loader()` synchronously; a synchronous throw is
 *      converted into a rejected promise. The tracked promise caches the
 *      value on success and removes itself from the in-flight map in
 *      `finally` — on failure too — so every waiter sees the rejection,
 *      nothing is cached, and the next call retries.
 *
 * Time: O(1) for every operation. Space: O(max) entries + O(in-flight loads).
 */

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

interface Entry<V> {
  value: V;
  /** Absolute expiry time per `now()`; Infinity when there is no TTL. */
  expiresAt: number;
}

/**
 * An O(1) LRU cache with lazy TTL expiry and request deduplication, built on
 * a single Map's insertion order (delete + set = move to most-recently-used).
 * Throws RangeError when `max < 1`.
 */
export function createLruCache<K, V>(options: LruCacheOptions): LruCache<K, V> {
  const { max, ttlMs, now = Date.now } = options;
  if (!Number.isFinite(max) || max < 1) {
    throw new RangeError(`max must be >= 1, got ${max}`);
  }
  if (ttlMs !== undefined && !(ttlMs > 0)) {
    throw new RangeError(`ttlMs must be > 0, got ${ttlMs}`);
  }

  const store = new Map<K, Entry<V>>();
  const inFlight = new Map<K, Promise<V>>();

  /** Live entry for `key`, sweeping it if expired. Never changes recency. */
  const peek = (key: K): Entry<V> | undefined => {
    const entry = store.get(key);
    if (entry === undefined) return undefined;
    if (entry.expiresAt !== Infinity && now() >= entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry;
  };

  /** Re-insert so the key becomes most-recently-used. */
  const touch = (key: K, entry: Entry<V>): void => {
    store.delete(key);
    store.set(key, entry);
  };

  const set = (key: K, value: V): void => {
    const expiresAt = ttlMs === undefined ? Infinity : now() + ttlMs;
    store.delete(key); // update = move to MRU, not growth
    store.set(key, { value, expiresAt });

    if (store.size > max) {
      const oldest = store.keys().next(); // least-recently-used
      if (!oldest.done) store.delete(oldest.value);
    }
  };

  const get = (key: K): V | undefined => {
    const entry = peek(key);
    if (entry === undefined) return undefined;
    touch(key, entry);
    return entry.value;
  };

  return {
    get,
    set,

    has(key: K): boolean {
      return peek(key) !== undefined;
    },

    delete(key: K): boolean {
      return store.delete(key);
    },

    get size(): number {
      return store.size;
    },

    getOrLoad(key: K, loader: () => Promise<V>): Promise<V> {
      const entry = peek(key);
      if (entry !== undefined) {
        touch(key, entry);
        return Promise.resolve(entry.value);
      }

      const pending = inFlight.get(key);
      if (pending !== undefined) return pending;

      // Invoke synchronously; a sync throw becomes a rejection.
      let loaded: Promise<V>;
      try {
        loaded = Promise.resolve(loader());
      } catch (error) {
        loaded = Promise.reject(error);
      }

      const tracked = loaded
        .then((value) => {
          set(key, value);
          return value;
        })
        .finally(() => {
          inFlight.delete(key); // on failure too, so the next call retries
        });

      inFlight.set(key, tracked);
      return tracked;
    },
  };
}
