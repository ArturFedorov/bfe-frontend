export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

/**
 * Parse a semver string such as `1.2.3` or `1.2.3-beta.1` into its parts.
 *
 * @throws if the input is not a valid `major.minor.patch[-prerelease]` string.
 */
export function parseVersion(input: string): ParsedVersion {
  // TODO: implement
  throw new Error('Not implemented');
}
