/**
 * Scan source code for `require()` / `import` calls, and flag any imported
 * package that is NOT declared in `declared` (the package.json dependencies).
 * Ignore relative imports (those starting with `.` or `/`).
 * Return the de-duplicated, sorted list of phantom package names.
 */
export function findPhantomDeps(source: string, declared: string[]): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
