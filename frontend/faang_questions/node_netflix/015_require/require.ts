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
  const cache: Record<string, unknown> = {};

  const resolve = (path: string): string | null => {
    if (path in fs) return path;
    if (path + '.js' in fs) return path + '.js';
    if (path + '.json' in fs) return path + '.json';
    if (path + '/index.js' in fs) return path + '/index.js';
    return null;
  };

  // Resolve relative path against a parent directory
  function resolvePath(from: string, to: string): string {
    if (!to.startsWith('.')) return to; // absolute — use as-is

    const dir = from.slice(0, from.lastIndexOf('/'));
    const parts = dir.split('/');

    for (const segment of to.split('/')) {
      if (segment === '..') parts.pop();
      else if (segment !== '.') parts.push(segment);
    }

    return parts.join('/');
  }

  // Build a require function scoped to a specific file
  function makeRequire(currentFile: string) {
    return function (path: string): unknown {
      const absolute = resolvePath(currentFile, path);
      const resolved = resolve(absolute);

      if (!resolved) throw new Error(`Module not found ${path}`);
      if (resolved in cache) return cache[resolved];

      const contents = fs[resolved];

      if (resolved.endsWith('.json')) {
        const parsed = JSON.parse(contents);
        cache[resolved] = parsed;
        return parsed;
      }

      const module = { exports: {} as any };
      cache[resolved] = module.exports;

      const fn = new Function('module', 'exports', 'require', contents);
      fn(module, module.exports, makeRequire(resolved)); // scoped require!

      cache[resolved] = module.exports;
      return module.exports;
    };
  }

  return makeRequire('');
}
