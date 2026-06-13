/**
 * Migrate calls to a deprecated API. Rewrite `oldApi(a, b)` into
 * `newApi(b, a)` (arguments swapped) across a source string.
 * Handle multiple calls; leave unrelated code untouched.
 *
 * Keep the argument grammar simple: comma-separated identifiers/literals with
 * no nested parentheses.
 */
export function migrateApi(code: string): string {
  // TODO: implement
  throw new Error('Not implemented');
}
