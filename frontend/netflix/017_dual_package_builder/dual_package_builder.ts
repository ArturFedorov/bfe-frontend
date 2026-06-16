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
export function buildDual(esmSource: string): DualOutput {
  // TODO: implement
  throw new Error('Not implemented');
}
