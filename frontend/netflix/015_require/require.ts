/**
 * An in-memory filesystem: absolute path -> file contents.
 * Implement a simplified `require` that supports:
 *   - exact file paths and `.js` / `.json` extension resolution
 *   - directory `index.js` fallback
 *   - module caching (same path returns the same exports object)
 *
 * Each `.js` module is a function body string with access to `module`,
 * `exports`, and `require`. JSON files resolve to the parsed value.
 */
export type FileSystem = Record<string, string>;

export function createRequire(fs: FileSystem): (path: string) => unknown {
  // TODO: implement and return a require(path) function
  throw new Error('Not implemented');
}
