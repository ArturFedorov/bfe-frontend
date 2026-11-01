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
  const result: Record<string, string[]> = {};
  for (const { name, dependencies } of manifests) {
    const keys = Object.keys(dependencies ?? {});
    const deps = result[name] || [];

    for (const key of keys) {
      if (!(key in result)) {
        result[key] = [];
      }

      deps.push(key);
    }

    result[name] = deps;
  }

  return result;
}
