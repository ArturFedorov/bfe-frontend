export function deepEqual(a: any, b: any): boolean {
  return equals(a, b, new WeakMap());
}

function equals(a: any, b: any, visited: WeakMap<object, Set<object>>) {
  if (Object.is(a, b)) return true;

  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return false;
  }

  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

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

  const keyA = Object.keys(a);
  const keyB = Object.keys(b);
  if (keyA.length !== keyB.length) return false;

  for (const key of keyA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!equals(a[key], b[key], visited)) return false;
  }

  return true;
}
