# 089. LRU Query Cache

**Difficulty:** Medium
**Topics:** LRU Cache, Map Insertion Order, TTL Expiry, Request Deduplication, Promises

---

## Description

The campaign dashboard runs the same expensive segment-count queries over and
over: every widget asks "how many customers match segment X?" and ten widgets
can ask for the same segment within the same render. Build a small in-memory
cache in front of the query service.

`createLruCache<K, V>({ max, ttlMs?, now? })` returns an object with:

- `get(key)` — the cached value or `undefined`. A hit **refreshes recency**
  (the key becomes most-recently-used).
- `set(key, value)` — inserts or updates. Updating an existing key refreshes
  its recency. Inserting when `size === max` **evicts the least-recently-used**
  entry first.
- `has(key)` — `true` when a live entry exists. Does **not** refresh recency.
- `delete(key)` — removes the entry; returns whether it existed.
- `size` — number of stored entries (a getter, not a method).
- `getOrLoad(key, loader)` — resolves with the cached value if present;
  otherwise calls `loader()` **once**, caches the result on success and
  resolves with it. While a load is in flight, concurrent `getOrLoad` calls
  for the same key share the pending promise (an **in-flight map**) — the
  loader is not called again. A failed load is **not cached**: the rejection
  propagates to every waiter and the next call retries.

When `ttlMs` is given, each entry expires `ttlMs` after it was set. Expiry is
checked **lazily**: `get` and `has` on an expired entry remove it and report a
miss (`undefined` / `false`). `now` defaults to `Date.now` and exists so tests
can drive a fake clock.

Use a single `Map` for storage: JavaScript `Map` preserves insertion order, so
"move to most-recently-used" is `delete` + `set` and "least-recently-used" is
`map.keys().next()`. Every operation is O(1).

## Examples

```ts
const cache = createLruCache<string, number>({ max: 2 });

cache.set('seg:vip', 1200);
cache.set('seg:churn', 340);
cache.get('seg:vip');          // 1200 — vip is now most-recently-used
cache.set('seg:new', 55);      // evicts 'seg:churn' (least-recently-used)
cache.has('seg:churn');        // false
cache.size;                    // 2

let t = 0;
const ttl = createLruCache<string, string>({ max: 10, ttlMs: 1000, now: () => t });
ttl.set('a', 'x');
t = 999;  ttl.get('a');        // 'x'
t = 1000; ttl.has('a');        // false — expired and removed
ttl.size;                      // 0

const loader = jest.fn(() => fetchSegmentCount('vip'));
const [a, b] = await Promise.all([
  cache.getOrLoad('seg:vip', loader),
  cache.getOrLoad('seg:vip', loader),
]);
loader.mock.calls.length;      // 1 — the second call joined the in-flight promise
```

## Constraints

- `max >= 1`; throw `RangeError` synchronously from `createLruCache` otherwise.
  `ttlMs`, when given, is `> 0`.
- All of `get`, `set`, `has`, `delete` and `size` are O(1).
- `has` never changes recency; `get` and `set` always do.
- Keys may be any value a `Map` accepts (objects, numbers, strings).
- `size` counts stored entries; an expired entry that has not yet been touched
  still counts until `get`/`has` sweeps it.
- `getOrLoad` must not call `loader` when a live cached value exists, and must
  call it exactly once across concurrent callers for the same key. On a miss
  the loader is invoked **synchronously** (before `getOrLoad` returns).
- A loader that throws synchronously is treated like a rejected promise.

## Target

O(1) per operation using `Map` insertion order; `getOrLoad` dedupes via a
separate `Map<K, Promise<V>>` of in-flight loads.

Senior signal: deleting from the in-flight map in `finally` (not only on
success) so a failure can retry; checking `max` eviction *after* the
delete-then-set dance so an update never evicts; and noticing that a TTL check
belongs in `get`/`has`, not in a timer, because timers keep the process alive
and do not scale to a million keys.

Bonus (only if asked): `map.keys().next()` is O(1) on paper, but V8 leaves a
tombstone on every `Map.delete` and the iterator skips them until the next
rehash — with `max = 10_000` and 200k inserts, eviction alone costs ~1.5 s.
Holding one long-lived `keys()` iterator and advancing it (every live entry is
always ahead of it) brings that back to ~30 ms; a doubly linked list is the
classic alternative.

## Interviewer follow-up

A segment count changes when customers enter or leave the segment. How would
you add explicit invalidation by key prefix (`invalidate('seg:')`) without
scanning the whole map, and what does stale-while-revalidate look like on top
of `getOrLoad`?
