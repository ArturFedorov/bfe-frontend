export interface Manifest {
  name?: string;
  version?: string;
  license?: string;
  scripts?: Record<string, string>;
}

/**
 * Validate a package.json before publish. Return a list of error messages
 * (empty = OK). Check, at minimum:
 *   - required fields present: name, version, license
 *   - no `postinstall` script (supply-chain risk)
 *   - `taken` versions list does not already include this version
 */
export function validatePublish(
  manifest: Manifest,
  taken: string[],
): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
