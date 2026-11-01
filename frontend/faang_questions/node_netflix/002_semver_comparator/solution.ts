/**
 * Compare two semver strings.
 * @returns -1 if a < b, 0 if equal, 1 if a > b. (Ignore prerelease for simplicity,
 *          or handle it for bonus points.)
 */
export function compare(a: string, b: string): -1 | 0 | 1 {
  // Split off prerelease at first "-"
  const [coreA, preA] = splitFirst(a, '-');
  const [coreB, preB] = splitFirst(b, '-');

  // Compare major.minor.patch numerically
  const partsA = coreA.split('.').map(Number);
  const partsB = coreB.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (partsA[i] < partsB[i]) return -1;
    if (partsA[i] > partsB[i]) return 1;
  }

  // Core is equal — handle prerelease
  // No prerelease > has prerelease
  if (!preA && !preB) return 0;
  if (!preA) return 1; // a is release, b is prerelease → a wins
  if (!preB) return -1; // b is release, a is prerelease → b wins

  // Both have prerelease — compare identifiers left to right
  const idsA = preA.split('.');
  const idsB = preB.split('.');
  const len = Math.max(idsA.length, idsB.length);

  for (let i = 0; i < len; i++) {
    // Fewer identifiers = less: "alpha" < "alpha.1"
    if (i >= idsA.length) return -1;
    if (i >= idsB.length) return 1;

    const numA = Number(idsA[i]);
    const numB = Number(idsB[i]);
    const isNumA = !isNaN(numA) && String(numA) === idsA[i];
    const isNumB = !isNaN(numB) && String(numB) === idsB[i];

    if (isNumA && isNumB) {
      // Both numeric — compare as numbers
      if (numA < numB) return -1;
      if (numA > numB) return 1;
    } else if (isNumA) {
      return -1; // numeric < string
    } else if (isNumB) {
      return 1; // string > numeric
    } else {
      // Both strings — lexical comparison
      if (idsA[i] < idsB[i]) return -1;
      if (idsA[i] > idsB[i]) return 1;
    }
  }

  return 0;
}

function splitFirst(s: string, sep: string): [string, string | undefined] {
  const idx = s.indexOf(sep);
  if (idx === -1) return [s, undefined];
  return [s.slice(0, idx), s.slice(idx + 1)];
}

export function gt(a: string, b: string): boolean {
  return compare(a, b) === 1;
}

export function lt(a: string, b: string): boolean {
  return compare(a, b) === -1;
}

export function eq(a: string, b: string): boolean {
  return compare(a, b) === 0;
}
