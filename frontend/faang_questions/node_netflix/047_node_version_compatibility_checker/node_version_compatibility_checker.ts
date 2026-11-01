import { satisfies } from '../003_semver_range_matcher/semver_range_matcher';

export interface PackageEngines {
  name: string;
  engines?: { node?: string };
}

/**
 * Parse each package's `engines.node` range and check it against `targetNode`.
 * Return the names of packages whose engine range does NOT include the target
 * Node version. Packages without an engines.node field are considered OK.
 * You may reuse a satisfies() helper.
 */
export function checkEngines(
  packages: PackageEngines[],
  targetNode: string,
): string[] {
  const incompatible: string[] = [];

  for (const pkg of packages) {
    const range = pkg?.engines?.node;
    if (!range) continue; // no constraint → OK

    if (!satisfies(targetNode, range)) {
      incompatible.push(pkg.name);
    }
  }

  return incompatible;
}
