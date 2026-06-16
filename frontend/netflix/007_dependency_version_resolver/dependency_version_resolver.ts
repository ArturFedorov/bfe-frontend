import { gt } from '../002_semver_comparator/semver_comparator';
import { satisfies } from '../003_semver_range_matcher/semver_range_matcher';

/**
 * A registry maps a package name to the concrete versions it publishes.
 * `requirements` maps a package name to a semver range that must be satisfied.
 * Resolve each requirement to the HIGHEST available version that satisfies it.
 *
 * @throws if any requirement cannot be satisfied.
 */
export interface Registry {
  [pkg: string]: string[];
}

export function resolve(
  registry: Registry,
  requirements: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [name, range] of Object.entries(requirements)) {
    const versions = registry[name];

    if (!versions || versions.length === 0) {
      throw new Error(`Package ${name} not found in registry`);
    }

    let best: string | null = null;

    for (const version of versions) {
      if (satisfies(version, range)) {
        if (!best || gt(version, best)) {
          best = version;
        }
      }
    }

    if (!best) {
      throw new Error(`No version of ${name} satisfies ${range}`);
    }

    result[name] = best;
  }

  return result;
}
