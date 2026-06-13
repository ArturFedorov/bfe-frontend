/**
 * Sort the import statements at the top of a file into three groups, each
 * sorted alphabetically by module specifier, separated by a blank line:
 *   1. Node builtins (e.g. 'fs', 'path', 'node:fs')
 *   2. External packages (bare specifiers)
 *   3. Internal/relative imports ('./', '../')
 * Return the rewritten import block (imports only).
 */
export function sortImports(imports: string[]): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
