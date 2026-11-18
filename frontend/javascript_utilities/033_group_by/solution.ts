/**
 * Buckets `items` by the string form of `key(item)` (or `item[key]` when a
 * property name is given).
 *
 * - Keys are coerced with `String(...)`, so `undefined` groups under
 *   `'undefined'` and `1` and `'1'` share a bucket.
 * - Buckets preserve the original relative order of their items.
 * - `hasOwnProperty` guards the lookup so keys such as `'constructor'` do not
 *   resolve to inherited members of `Object.prototype`.
 */
export function groupBy<T>(
  items: T[],
  key: keyof T | ((item: T) => unknown),
): Record<string, T[]> {
  const getKey =
    typeof key === 'function' ? key : (item: T) => item[key as keyof T];

  const result: Record<string, T[]> = {};

  for (const item of items) {
    const bucket = String(getKey(item));

    if (!Object.prototype.hasOwnProperty.call(result, bucket)) {
      result[bucket] = [];
    }

    result[bucket].push(item);
  }

  return result;
}
