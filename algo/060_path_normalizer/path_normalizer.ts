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
  if(!path.startsWith('/')) {
    throw new Error(`Expected an absolute path, got "${path}"`);
  }

  const stack: string[] = [];

  for(const segment of path.split('/')) {
    if(segment === '' || segment === '.') {
      continue;
    }

    if(segment === '..') {
      stack.pop();
    } else {
      stack.push(segment);
    }
  }

  return '/' + stack.join('/');
}
