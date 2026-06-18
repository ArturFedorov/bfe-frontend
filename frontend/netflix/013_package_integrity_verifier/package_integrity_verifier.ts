import { createHash } from 'crypto';

/**
 * Compute the Subresource-Integrity-style hash of `contents` and compare it
 * against the registry-reported `integrity` string of the form
 * `sha512-<base64>`. Return true when they match.
 *
 * The helper `computeIntegrity` is provided to encourage reuse.
 */
export function computeIntegrity(
  contents: string | Buffer,
  algorithm: string = 'sha512',
): string {
  const hash = createHash(algorithm).update(contents).digest('base64');
  return `sha512-${hash}`;
}

export function verifyIntegrity(
  contents: string | Buffer,
  integrity: string,
): boolean {
  const dashIndex = integrity.indexOf('-');
  if (dashIndex === -1) return false;

  const algorithm = integrity.slice(0, dashIndex);

  const actual = computeIntegrity(contents, algorithm);

  return actual === integrity;
}
