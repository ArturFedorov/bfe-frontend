/**
 * Every helper below is a single `Array.prototype.reduce` call. The
 * accumulator is mutated in place (push / assign) and returned, which keeps
 * each helper O(n); rebuilding the accumulator with spread on every step
 * would be O(n^2).
 */

/**
 * `push` (not `concat`) so an array returned by `fn` stays nested and an
 * `undefined` result still occupies its slot.
 */
export function map<T, U>(
  arr: T[],
  fn: (item: T, index: number, arr: T[]) => U,
): U[] {
  return arr.reduce((acc: U[], item, index) => {
    acc.push(fn(item, index, arr));
    return acc;
  }, []);
}

export function filter<T>(
  arr: T[],
  predicate: (item: T, index: number, arr: T[]) => boolean,
): T[] {
  return arr.reduce((acc: T[], item, index) => {
    if (predicate(item, index, arr)) {
      acc.push(item);
    }
    return acc;
  }, []);
}

/**
 * Flattens exactly one level: an array result is spread, anything else is
 * pushed as-is, and nested arrays inside the result are left alone.
 */
export function flatMap<T, U>(
  arr: T[],
  fn: (item: T, index: number, arr: T[]) => U | U[],
): U[] {
  return arr.reduce((acc: U[], item, index) => {
    const result = fn(item, index, arr);

    if (Array.isArray(result)) {
      acc.push(...result);
    } else {
      acc.push(result);
    }

    return acc;
  }, []);
}

/**
 * Keys are coerced to string by property assignment, so a symbol key stays a
 * symbol and everything else becomes a string. `?? 0` seeds a new bucket.
 */
export function countBy<T>(
  arr: T[],
  keyFn: (item: T) => PropertyKey,
): Record<string, number> {
  return arr.reduce((acc: Record<string, number>, item) => {
    const key = keyFn(item) as string;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

/**
 * Later items overwrite earlier ones with the same key (last wins).
 */
export function keyBy<T>(
  arr: T[],
  keyFn: (item: T) => PropertyKey,
): Record<string, T> {
  return arr.reduce((acc: Record<string, T>, item) => {
    acc[keyFn(item) as string] = item;
    return acc;
  }, {});
}
