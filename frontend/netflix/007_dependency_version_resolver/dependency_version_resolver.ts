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
  // TODO: implement (you may reuse a satisfies()/compare() helper)
  throw new Error('Not implemented');
}
