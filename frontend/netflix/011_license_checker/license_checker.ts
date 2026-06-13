export interface PackageInfo {
  name: string;
  license: string;
}

/**
 * Given the project's own license and its dependencies, return the names of
 * dependencies whose license is incompatible. For this exercise: a permissive
 * project (e.g. MIT) is incompatible with copyleft licenses (GPL, AGPL, LGPL).
 */
export function checkLicenses(
  projectLicense: string,
  deps: PackageInfo[],
): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
