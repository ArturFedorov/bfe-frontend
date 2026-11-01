import { satisfies } from '../003_semver_range_matcher/semver_range_matcher';

export interface RiskAssessment {
  name: string;
  version: string;
  risk: 'low' | 'high';
}

/**
 * Compare node_modules before/after an install (name -> version maps) and
 * report newly added packages with a basic risk assessment. A package is
 * considered HIGH risk if its name appears in `knownRisky`.
 */
export function reportNewPackages(
  before: Record<string, string>,
  after: Record<string, string>,
  knownRisky: string[],
): RiskAssessment[] {
  const riskySet = new Set(knownRisky);
  const result: RiskAssessment[] = [];

  for (const [name, version] of Object.entries(after)) {
    if (name in before) continue;

    result.push({
      name,
      version,
      risk: riskySet.has(name) ? 'high' : 'low',
    });
  }

  return result;
}
