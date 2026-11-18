export interface PureCallReport {
  deterministic: boolean;
  mutatesArgs: boolean;
  results: unknown[];
}

/**
 * Minimal structural equality: primitives via `Object.is`, arrays by index,
 * `Date` by timestamp, plain objects by own enumerable keys. Enough for the
 * values `structuredClone` can produce; cycles are not expected here.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return false;
  }

  if (a instanceof Date || b instanceof Date) {
    return (
      a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
    );
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      deepEqual((a as any)[key], (b as any)[key]),
  );
}

/**
 * Calls `fn` `runs` times, each time with a fresh `structuredClone` of `args`,
 * and reports whether the results agreed and whether any run changed its
 * arguments. The caller's `args` are never handed to `fn`, so the audit itself
 * has no side effects on them.
 */
export function isPureCall<A extends unknown[]>(
  fn: (...args: A) => unknown,
  args: A,
  options: { runs?: number } = {},
): PureCallReport {
  const { runs = 3 } = options;

  if (!Number.isInteger(runs) || runs < 1) {
    throw new RangeError(`runs must be a positive integer, got ${runs}`);
  }

  const results: unknown[] = [];
  let mutatesArgs = false;

  for (let i = 0; i < runs; i++) {
    const copy = structuredClone(args);

    results.push(fn(...copy));

    // If the clone no longer matches the original, `fn` wrote into it.
    if (!deepEqual(copy, args)) {
      mutatesArgs = true;
    }
  }

  const deterministic = results.every((result) =>
    deepEqual(result, results[0]),
  );

  return { deterministic, mutatesArgs, results };
}

/**
 * Memoizes `fn` by `JSON.stringify(args)`. Safe only for pure functions: the
 * cache replays the first result forever, so a non-deterministic `fn` would
 * go stale and a side-effecting `fn` would skip its effect on every hit.
 *
 * `cache.has` guards the lookup so a cached `undefined` result is honored.
 */
export function memoizePure<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result: ReturnType<T> = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}
