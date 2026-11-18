/**
 * Freezes `value` and everything reachable from it through plain objects and
 * arrays, then returns the same reference.
 *
 * - Primitives, `null` and functions are returned as-is.
 * - `Date`, `Map` and `Set` are left untouched: `Object.freeze` cannot protect
 *   their internal slots, so freezing them would only give false confidence.
 * - An already-frozen object is assumed to be deeply frozen and is skipped.
 * - A `WeakSet` records visited objects so cyclic graphs terminate.
 */
export function deepFreeze<T>(value: T): Readonly<T> {
  freeze(value, new WeakSet());
  return value;
}

function isPlainObjectOrArray(value: object): boolean {
  if (Array.isArray(value)) {
    return true;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function freeze(value: unknown, seen: WeakSet<object>): void {
  if (value === null || typeof value !== 'object') {
    return;
  }

  if (seen.has(value) || Object.isFrozen(value)) {
    return;
  }

  if (!isPlainObjectOrArray(value)) {
    return;
  }

  seen.add(value);

  // Freeze the container first so a cycle back to it stops immediately.
  Object.freeze(value);

  for (const child of Object.values(value)) {
    freeze(child, seen);
  }
}
