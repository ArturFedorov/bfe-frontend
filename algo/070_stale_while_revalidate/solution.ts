/**
 * 070. Stale-While-Revalidate Cache — reference solution
 *
 * Approach: two maps per wrapper.
 *   - `cache`    : key -> { value }   (last successful fetch; wrapped in an
 *                  object so a legitimately `undefined`/falsy T still counts
 *                  as a hit)
 *   - `inFlight` : key -> Promise<T>  (the single fetch currently running for
 *                  that key, whether it is a cold fetch or a refresh)
 *
 * `fetchAndCache(key)` runs the fetcher, writes the value into `cache` on
 * success, and removes its `inFlight` entry on settlement (success or
 * failure). On a failure nothing is written, so a stale value stays intact.
 *
 * On each call:
 *   - warm (cache hit): start a refresh unless one is already in flight,
 *     swallow its eventual rejection (background work must never be an
 *     unhandled rejection), and resolve immediately with the cached value.
 *   - cold, fetch in flight: join that promise (concurrent cold calls share).
 *   - cold, nothing in flight: start the fetch and return it — the caller
 *     awaits it and sees its rejection directly.
 *
 * Time: O(1) per call. Space: O(#distinct keys) cached + O(#keys in flight).
 */

export function staleWhileRevalidate<T>(
  fetcher: (key: string) => Promise<T>,
): (key: string) => Promise<T> {
  const cache = new Map<string, { value: T }>();
  const inFlight = new Map<string, Promise<T>>();

  const fetchAndCache = (key: string): Promise<T> => {
    const promise = fetcher(key)
      .then((value) => {
        cache.set(key, { value });
        return value;
      })
      .finally(() => {
        inFlight.delete(key);
      });

    inFlight.set(key, promise);
    return promise;
  };

  return (key: string): Promise<T> => {
    const hit = cache.get(key);

    if (hit) {
      // Warm: revalidate in the background (at most one refresh per key) and
      // serve the stale value right away.
      if (!inFlight.has(key)) {
        fetchAndCache(key).catch(() => {
          /* failed refresh: keep the old value, retry on next call */
        });
      }
      return Promise.resolve(hit.value);
    }

    // Cold: share the in-flight fetch if there is one, else start it.
    return inFlight.get(key) ?? fetchAndCache(key);
  };
}
