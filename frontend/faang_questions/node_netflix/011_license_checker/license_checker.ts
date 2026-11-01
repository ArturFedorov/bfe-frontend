export interface PackageInfo {
  name: string;
  license: string;
}

function isCopyLeft(license: string): boolean {
  return license.toUpperCase().includes('GPL');
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
  // GPL projects can use anything
  if (isCopyLeft(projectLicense)) return [];

  // Permissive projects can't include GPL dependencies
  return deps.filter((dep) => isCopyLeft(dep.license)).map((dep) => dep.name);
}
