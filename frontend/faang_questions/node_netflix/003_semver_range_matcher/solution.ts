import { compare } from '../002_semver_comparator/semver_comparator';

/**
 * Return true if `version` satisfies the given `range`.
 * Support: exact (`1.2.3`), `^`, `~`, `>=`, `>`, `<=`, `<`, and `||` unions.
 */
export function satisfies(version: string, range: string): boolean {
  const orGroups = range.split('||').map((s) => s.trim());

  return orGroups.some((group) => {
    const condition = group.split(/\s+/);
    return condition.every((cond) => matchCondition(version, cond));
  });
}

function matchCondition(version: string, condition: string): boolean {
  const match = condition.match(/^(>=|<=|>|<|=|\^|~)?(.+)$/);
  if (!match) return false;

  const operator = match[1] || '=';
  const target = match[2];

  switch (operator) {
    case '=':
      return compare(version, target) === 0;
    case '>':
      return compare(version, target) === 1;
    case '>=':
      return compare(version, target) >= 0;
    case '<':
      return compare(version, target) === -1;
    case '<=':
      return compare(version, target) <= 0;
    case '^':
      return satisfiesCaretRange(version, target);
    case '~':
      return satisfiesTildeRange(version, target);
    default:
      return false;
  }
}

function satisfiesCaretRange(version: string, target: string): boolean {
  const [major, minor, patch] = target.split('.').map(Number);

  let ceiling: string;

  if (major !== 0) {
    ceiling = `${major + 1}.0.0`;
  } else if (minor !== 0) {
    ceiling = `0.${minor + 1}.0`;
  } else {
    ceiling = `0.0.${patch + 1}`;
  }

  return compare(version, target) >= 0 && compare(version, ceiling) === -1;
}

function satisfiesTildeRange(version: string, target: string): boolean {
  const [major, minor] = target.split('.').map(Number);
  const ceiling = `${major}.${minor + 1}.0`;

  return compare(version, target) >= 0 && compare(version, ceiling) === -1;
}
