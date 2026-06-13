export interface PackageManifest {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
}

/**
 * Build an adjacency map: package name -> array of dependency names.
 * Every package referenced should appear as a key (even if it has no deps).
 */
export function buildGraph(
  manifests: PackageManifest[],
): Record<string, string[]> {
  // TODO: implement
  throw new Error('Not implemented');
}
