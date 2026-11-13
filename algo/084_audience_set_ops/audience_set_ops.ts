/**
 * `true` when `ids` is strictly increasing in default JavaScript string
 * order (`<`). Duplicates make it false.
 */
export function isSorted(ids: readonly string[]): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Ids in `a` or `b`. Throws TypeError if either input is not sorted/unique. */
export function union(a: readonly string[], b: readonly string[]): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Ids in both `a` and `b`. Throws TypeError if either input is not sorted/unique. */
export function intersect(
  a: readonly string[],
  b: readonly string[],
): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Ids in `a` that are not in `b`. Throws TypeError if either input is not sorted/unique. */
export function difference(
  a: readonly string[],
  b: readonly string[],
): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Ids present in every list. Processes smallest list first and exits early
 * when the running result becomes empty. `[]` for no lists.
 * Throws TypeError if any list is not sorted/unique.
 */
export function intersectMany(lists: readonly (readonly string[])[]): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
