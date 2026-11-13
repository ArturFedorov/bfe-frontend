/**
 * Recursively copies `value`.
 *
 * Handles primitives, plain objects, arrays, Date, RegExp, Map, Set and
 * circular references. A `WeakMap` records original -> clone so a reference
 * that re-appears is resolved to the already-created clone rather than
 * recursed into forever.
 *
 * Containers are registered in `seen` *before* their contents are cloned so
 * that self-references inside them resolve correctly.
 */
export function deepClone<T>(value: T): T {
  return cloneValue(value, new WeakMap());
}

function cloneValue(value: any, seen: WeakMap<object, any>): any {
  // Primitives (including null/undefined) and functions are returned as-is.
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (value instanceof RegExp) {
    const copy = new RegExp(value.source, value.flags);
    copy.lastIndex = value.lastIndex;
    return copy;
  }

  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy);
    value.forEach((v, k) => {
      copy.set(cloneValue(k, seen), cloneValue(v, seen));
    });
    return copy;
  }

  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    value.forEach((v) => {
      copy.add(cloneValue(v, seen));
    });
    return copy;
  }

  if (Array.isArray(value)) {
    const copy: any[] = [];
    seen.set(value, copy);
    for (let i = 0; i < value.length; i++) {
      copy[i] = cloneValue(value[i], seen);
    }
    return copy;
  }

  // Plain (or class-instance) object: keep its prototype, copy own enumerable keys.
  const copy = Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    copy[key] = cloneValue(value[key], seen);
  }
  return copy;
}
