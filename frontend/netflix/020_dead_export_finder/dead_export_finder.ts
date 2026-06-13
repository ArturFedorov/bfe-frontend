export interface SourceFile {
  path: string;
  code: string;
}

/**
 * Parse files for named `export` declarations and scan all files for matching
 * named `import` statements. Report exports that are never imported anywhere.
 * Return an array of `{ file, name }` for each unused export, sorted by file
 * then name.
 */
export function findDeadExports(
  files: SourceFile[],
): { file: string; name: string }[] {
  // TODO: implement
  throw new Error('Not implemented');
}
