/**
 * Structural equality.
 *
 * - Primitives use `Object.is`, so `NaN === NaN` is true and `+0 !== -0`.
 * - `null`/`undefined` are only equal to themselves.
 * - Arrays vs. objects, Dates, RegExps and prototypes must match in kind.
 * - Date compares by timestamp, RegExp by source + flags.
 * - Objects compare own enumerable string keys recursively; key counts must match.
 * - A `WeakMap` of visited pairs guards against infinite recursion on cycles.
 */
export function deepEqual(a: any, b: any): boolean {
  return equals(a, b, new WeakMap());
}

function equals(
  a: any,
  b: any,
  visited: WeakMap<object, Set<object>>,
): boolean {
  if (Object.is(a, b)) return true;

  // From here on, at least one differs; both must be non-null objects to continue.
  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return false;
  }

  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

  // Cycle guard: if we're already comparing this exact pair, assume equal.
  const seenForA = visited.get(a);
  if (seenForA?.has(b)) return true;
  if (seenForA) seenForA.add(b);
  else visited.set(a, new Set([b]));

  if (a instanceof Date) return a.getTime() === b.getTime();

  if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!equals(a[i], b[i], visited)) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!equals(a[key], b[key], visited)) return false;
  }

  return true;
}
