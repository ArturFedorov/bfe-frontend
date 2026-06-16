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
  // TODO: implement
  throw new Error('Not implemented');
}
