/**
 * Given the current version and a list of conventional-commit subjects, compute
 * the next version:
 *   - a breaking change ('!' after type, or 'BREAKING CHANGE' in body) -> major
 *   - any 'feat' -> minor
 *   - otherwise (fix/chore/...) -> patch
 * Major bump resets minor & patch to 0; minor bump resets patch to 0.
 */
export function nextVersion(current: string, commits: string[]): string {
  // TODO: implement
  throw new Error('Not implemented');
}
