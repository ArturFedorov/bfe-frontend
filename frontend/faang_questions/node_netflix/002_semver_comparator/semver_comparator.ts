/**
 * Compare two semver strings.
 * @returns -1 if a < b, 0 if equal, 1 if a > b. (Ignore prerelease for simplicity,
 *          or handle it for bonus points.)
 */
export function compare(a: string, b: string): -1 | 0 | 1 {
  // TODO: implement
  throw new Error('Not implemented');
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
