/**
 * Migrate calls to a deprecated API. Rewrite `oldApi(a, b)` into
 * `newApi(b, a)` (arguments swapped) across a source string.
 * Handle multiple calls; leave unrelated code untouched.
 *
 * Keep the argument grammar simple: comma-separated identifiers/literals with
 * no nested parentheses.
 */
export function migrateApi(code: string): string {
  const regex = /oldApi\(([^,]+),\s*([^)]+)\)/g;

  return code.replace(regex, (_, arg1: string, arg2: string) => {
    return `newApi(${arg2.trim()}, ${arg1.trim()})`;
  });
}
