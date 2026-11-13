/**
 * Reference solution for 008 — change detector (deep object diff).
 *
 * Walk both objects key by key:
 *   - key only in new  → add
 *   - key only in old  → remove
 *   - both plain objects → recurse, extending the dot path
 *   - otherwise (primitives, arrays, …) → compare by value; update if different
 *
 * Arrays are deliberately treated as leaf VALUES (one `update` for the whole
 * array when any element differs) rather than diffed element by element.
 *
 * Order: existing keys in the old object's order first, then keys that are
 * new — stable and predictable, which is what a consumer replaying changes wants.
 */
export interface Change {
  type: 'add' | 'remove' | 'update';
  path: string;
  oldValue?: any;
  newValue?: any;
}

/** A plain data object: not null, not an array, not a class instance. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Structural equality for JSON-like data (primitives, arrays, plain objects). */
function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((item, i) => isDeepEqual(item, b[i]))
    );
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return (
      keysA.length === keysB.length &&
      keysA.every((key) => key in b && isDeepEqual(a[key], b[key]))
    );
  }

  return false; // different primitives, or different kinds of value
}

export function detectChanges(oldObj: any, newObj: any): Change[] {
  const changes: Change[] = [];

  const walk = (
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
    prefix: string,
  ) => {
    const path = (key: string) => (prefix ? `${prefix}.${key}` : key);

    for (const key of Object.keys(oldValue)) {
      if (!(key in newValue)) {
        changes.push({
          type: 'remove',
          path: path(key),
          oldValue: oldValue[key],
        });
      } else if (isPlainObject(oldValue[key]) && isPlainObject(newValue[key])) {
        walk(oldValue[key], newValue[key], path(key)); // nested object: descend
      } else if (!isDeepEqual(oldValue[key], newValue[key])) {
        changes.push({
          type: 'update',
          path: path(key),
          oldValue: oldValue[key],
          newValue: newValue[key],
        });
      }
    }

    for (const key of Object.keys(newValue)) {
      if (!(key in oldValue)) {
        changes.push({ type: 'add', path: path(key), newValue: newValue[key] });
      }
    }
  };

  walk(oldObj ?? {}, newObj ?? {}, '');
  return changes;
}
