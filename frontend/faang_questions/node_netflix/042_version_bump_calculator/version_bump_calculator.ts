import { parseVersion } from '../001_semver_parser/semver_parser';

const BREAKING_CHANGE_MESSAGE = 'BREAKING CHANGE';
/**
 * Given the current version and a list of conventional-commit subjects, compute
 * the next version:
 *   - a breaking change ('!' after type, or 'BREAKING CHANGE' in body) -> major
 *   - any 'feat' -> minor
 *   - otherwise (fix/chore/...) -> patch
 * Major bump resets minor & patch to 0; minor bump resets patch to 0.
 */
export function nextVersion(current: string, commits: string[]): string {
  if (commits.length === 0) return current;
  const { major, minor, patch } = parseVersion(current);

  let bump: 'major' | 'minor' | 'patch' = 'patch';

  for (const commit of commits) {
    const type = commit.split(':')?.[0] || '';

    if (!type) return current;

    if (commit.includes(BREAKING_CHANGE_MESSAGE) || type.endsWith('!')) {
      bump = 'major';
      break;
    }

    const baseType = type.replace(/[(!].*/, '');

    if (baseType === 'feat') {
      bump = 'minor';
    }
  }

  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}
