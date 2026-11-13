/**
 * Re-implementations of Object.keys / values / entries.
 *
 * `for...in` enumerates own AND inherited enumerable string keys (symbols are
 * never visited), so a `hasOwnProperty` check is all that's needed to keep
 * only own properties. Numeric keys come back as strings naturally.
 */
export function objectKeys(obj: object): string[] {
  const keys: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      keys.push(key);
    }
  }
  return keys;
}

export function objectValues(obj: object): any[] {
  return objectKeys(obj).map((key) => (obj as any)[key]);
}

export function objectEntries(obj: object): [string, any][] {
  return objectKeys(obj).map((key) => [key, (obj as any)[key]]);
}
