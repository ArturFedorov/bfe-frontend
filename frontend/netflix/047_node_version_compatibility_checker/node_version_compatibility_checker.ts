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
  // TODO: implement
  throw new Error('Not implemented');
}
