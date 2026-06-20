export interface DualOutput {
  cjs: string;
  esm: string;
}

/**
 * Given ESM source that uses `export function`/`export const` and a single
 * default export via `export default`, emit both an ESM string (unchanged) and
 * a CommonJS string that uses `module.exports` / `exports.<name>`.
 *
 * Keep it simple: support `export const x =`, `export function f(`, and
 * `export default <expr>;`.
 */
export function buildDual(esmSource: string): { cjs: string; esm: string } {
  const cjs = esmSource
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();

      // import x from 'pkg'
      // import { a, b } from 'pkg'
      // import * as x from 'pkg'
      if (trimmed.startsWith('import ')) {
        return trimmed
          .replace(/^import\s+/, 'const ')
          .replace(/\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/, " = require('$1');");
      }

      // export default ...
      if (trimmed.startsWith('export default ')) {
        return trimmed.replace(/^export default\s+/, 'module.exports = ');
      }

      // export function name(...) { ... }
      if (trimmed.startsWith('export function ')) {
        const match = trimmed.match(/^export function\s+(\w+)/);
        if (match) {
          return trimmed.replace(
            /^export function\s+/,
            `exports.${match[1]} = function `,
          );
        }
      }

      // export const name = ...
      if (trimmed.startsWith('export const ')) {
        return trimmed.replace(/^export const\s+/, 'exports.');
      }

      // export let name = ...
      if (trimmed.startsWith('export let ')) {
        return trimmed.replace(/^export let\s+/, 'exports.');
      }

      // export { a, b }
      const namedExport = trimmed.match(/^export\s*\{([^}]+)\}\s*;?\s*$/);
      if (namedExport) {
        const names = namedExport[1].split(',').map((s) => s.trim());
        return names.map((n) => `exports.${n} = ${n};`).join(' ');
      }

      // export class Name { ... }
      if (trimmed.startsWith('export class ')) {
        const match = trimmed.match(/^export class\s+(\w+)/);
        if (match) {
          return trimmed.replace(
            /^export class\s+/,
            `exports.${match[1]} = class `,
          );
        }
      }

      return line;
    })
    .join('\n');

  return { cjs, esm: esmSource };
}
