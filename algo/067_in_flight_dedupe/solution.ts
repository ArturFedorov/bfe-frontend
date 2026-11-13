/**
 * 067. In-Flight Request Dedupe — reference solution
 *
 * Approach: keep a Map<key, Promise> of fetches that are currently in flight.
 * A call whose key is already present simply returns the stored promise, so
 * every concurrent caller observes the same settlement (value or rejection).
 * The stored promise is `fn(key).finally(() => map.delete(key))`: as soon as
 * the fetch settles — either way — the entry disappears, so the next call
 * re-invokes `fn`. `finally` forwards the original value/reason untouched, and
 * because the map only ever holds in-flight entries memory stays bounded by
 * the number of concurrent distinct keys.
 *
 * Note: we store the `.finally(...)` promise (not the raw `fn` promise) so the
 * entry is removed before any caller's own continuation runs — a caller that
 * immediately re-requests the key in its `.then` gets a fresh fetch.
 *
 * Time: O(1) per call (Map get/set/delete). Space: O(#keys currently in flight).
 */

export function dedupe<T>(
  fn: (key: string) => Promise<T>,
): (key: string) => Promise<T> {
  const inFlight = new Map<string, Promise<T>>();

  return (key: string): Promise<T> => {
    const existing = inFlight.get(key);
    if (existing) return existing;

    const promise = fn(key).finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, promise);
    return promise;
  };
}
