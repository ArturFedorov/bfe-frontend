/**
 * Reduces an absolute POSIX-style path to its canonical form:
 * - `.` segments are removed
 * - `..` pops the previous segment (never above root)
 * - duplicate slashes collapse
 * - no trailing slash in the result, except the bare root `/`
 *
 * Throws an Error when the input is empty or does not start with `/`.
 * Do not use the `path` module.
 */
export function normalizePath(path: string): string {
  // TODO: implement
  throw new Error('Not implemented');
}
