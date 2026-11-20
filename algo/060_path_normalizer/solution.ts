/**
 * 060. Path Normalizer — reference solution
 *
 * Split on '/', walk segments once with a stack: skip empty and '.', pop on
 * '..' (never above root), push everything else. Join with a leading '/'.
 *
 * Time: O(n). Space: O(n).
 */
export function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`Expected an absolute path, got "${path}"`);
  }

  const stack: string[] = [];
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      stack.pop();
    } else {
      stack.push(segment);
    }
  }

  return '/' + stack.join('/');
}
