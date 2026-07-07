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
export function validatePublish(manifest: Manifest, taken: string[]): string[] {
  const errors: string[] = [];

  const REQUIRED_FIELDS = ['name', 'version', 'license'];

  REQUIRED_FIELDS.forEach((field) => {
    if (!(field in manifest)) {
      errors.push(`missing required field: ${field}`);
    }
  });

  if (manifest?.scripts?.postinstall) {
    errors.push('postinstall script is not allowed (supply-chain risk');
  }

  if (manifest.version && taken.includes(manifest.version)) {
    errors.push(`version ${manifest.version} is already published`);
  }

  return errors;
}
