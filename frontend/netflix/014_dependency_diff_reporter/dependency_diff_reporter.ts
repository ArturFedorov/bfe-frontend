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
  // TODO: implement
  throw new Error('Not implemented');
}
