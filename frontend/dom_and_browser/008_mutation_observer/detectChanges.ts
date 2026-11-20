export interface Change {
  type: 'add' | 'remove' | 'update';
  path: string;
  oldValue?: any;
  newValue?: any;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);

  return proto === Object.prototype || proto === null;
}

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

  return false;
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
        walk(oldValue[key], newValue[key], path(key));
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
        changes.push({
          type: 'add',
          path: path(key),
          newValue: newValue[key],
        });
      }
    }
  };

  walk(oldObj ?? {}, newObj ?? {}, '');
  return changes;
}
