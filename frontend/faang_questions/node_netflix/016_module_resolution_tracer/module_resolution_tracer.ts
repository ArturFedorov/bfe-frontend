/**
 * Given an existing-files set and a require specifier from a directory, return
 * the ordered list of candidate paths Node would try until one exists.
 * Stop at the first path that exists; the last entry is the resolved file.
 *
 * Example order for `require('./util')` from `/app`:
 *   /app/util, /app/util.js, /app/util.json, /app/util/index.js
 */
export function traceResolution(
  files: Set<string>,
  fromDir: string,
  specifier: string,
): string[] {
  const result: string[] = [];

  const base = resolvePath(fromDir, specifier);

  const candidates = [base, base + '.js', base + '.json', base + '/index.js'];

  for (const candidate of candidates) {
    result.push(candidate);

    if (files.has(candidate)) {
      return result;
    }
  }

  return result;
}

function resolvePath(fromDir: string, specifier: string) {
  if (!specifier.startsWith('.')) return specifier;

  const parts = fromDir.split('/');

  for (const segment of specifier.split('/')) {
    if (segment === '..') parts.pop();
    else if (segment !== '.') parts.push(segment);
  }

  return parts.join('/');
}
