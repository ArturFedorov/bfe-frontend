import { createHash } from 'crypto';

/**
 * Compute the Subresource-Integrity-style hash of `contents` and compare it
 * against the registry-reported `integrity` string of the form
 * `sha512-<base64>`. Return true when they match.
 *
 * The helper `computeIntegrity` is provided to encourage reuse.
 */
export function computeIntegrity(contents: string | Buffer): string {
  const hash = createHash('sha512').update(contents).digest('base64');
  return `sha512-${hash}`;
}

export function verifyIntegrity(
  contents: string | Buffer,
  integrity: string,
): boolean {
  // TODO: implement (compare computeIntegrity(contents) against integrity)
  throw new Error('Not implemented');
}
