export interface SourceFile {
  path: string;
  code: string;
}

export type Transform = (code: string, path: string) => string;

export interface CodemodResult {
  changed: string[];
  unchanged: string[];
  errors: { path: string; message: string }[];
}

/**
 * Apply a transform across files. Collect which files changed, which were
 * untouched (transform returned identical code), and which threw (capture the
 * error message and continue). Never let one file's failure abort the run.
 */
export function runCodemod(
  files: SourceFile[],
  transform: Transform,
): CodemodResult {
  const results: CodemodResult = {
    changed: [],
    unchanged: [],
    errors: [],
  };

  for (const { path, code } of files) {
    try {
      const transformed = transform(code, path);

      if (code === transformed) {
        results.unchanged.push(path);
        continue;
      }

      results.changed.push(path);
    } catch (e: any) {
      results.errors.push({ path, message: e.message });
    }
  }

  return results;
}
