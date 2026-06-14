export type ExportsField = string | { [key: string]: ExportsField };

/**
 * Resolve a subpath against a package.json `exports` field for a set of active
 * conditions (e.g. ['import', 'node']). Support:
 *   - string shorthand ("." mapping)
 *   - subpath keys ("./sub")
 *   - condition objects ("import" / "require" / "node" / "browser" / "default")
 * Return the matched target string, or null when nothing matches.
 */
export function resolveExports(
  exportsField: ExportsField,
  subpath: string,
  conditions: string[],
): string | null {
  // TODO: implement
  throw new Error('Not implemented');
}
