/**
 * Reference solution for 005 — Array.prototype.flat from scratch.
 *
 * Flattens nested arrays up to `depth` levels (default 1). `Infinity`
 * flattens completely; `0` returns a shallow copy. Always returns a new array.
 */
export function myFlat(arr: any[], depth: number = 1): any[] {
  const result: any[] = [];

  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      // Recurse one level down with a decremented budget. Infinity - 1 stays
      // Infinity, so full flattening falls out naturally.
      result.push(...myFlat(item, depth - 1));
    } else {
      result.push(item);
    }
  }

  return result;
}
