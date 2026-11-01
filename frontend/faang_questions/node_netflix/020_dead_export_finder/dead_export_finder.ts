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
  const result: { file: string; name: string }[] = [];

  const allImports = new Set<string>();

  for (const { code } of files) {
    for (const name of parseImports(code)) {
      allImports.add(name);
    }
  }

  for (const { path, code } of files) {
    for (const name of parseExports(code)) {
      if (!allImports.has(name)) {
        result.push({ file: path, name });
      }
    }
  }

  return result.sort((a, b) =>
    a.file !== b.file
      ? a.file.localeCompare(b.file)
      : a.name.localeCompare(b.name),
  );
}

function parseExports(code: string) {
  const exports: string[] = [];

  for (const line of code.split('\n')) {
    const trimmed = line.trim();

    if (trimmed.startsWith('export function ')) {
      const name = trimmed.split('export function ')[1].split('(')[0].trim();
      exports.push(name);
    } else if (trimmed.startsWith('export const ')) {
      const name = trimmed.split('export const ')[1].split('=')[0].trim();
      exports.push(name);
    } else if (trimmed.startsWith('export let ')) {
      const name = trimmed.split('export let ')[1].split('=')[0].trim();
      exports.push(name);
    } else if (trimmed.startsWith('export class ')) {
      const name = trimmed.split('export class ')[1].split(/[\s{]/)[0].trim();
      exports.push(name);
    } else if (trimmed.startsWith('export default ')) {
      exports.push('default');
    }

    // export { a, b }
    const namedExport = trimmed.match(/^export\s*\{([^}]+)\}/);
    if (namedExport) {
      for (const name of namedExport[1].split(',')) {
        const trimmedName = name.trim();
        if (trimmedName) exports.push(trimmedName);
      }
    }
  }

  return exports;
}

function parseImports(code: string) {
  const imports: string[] = [];
  const regex = /import\s+\{([^}]+)\}\s+from/g;

  // Run on full code, not line by line — handles multi-line imports
  for (const match of code.matchAll(regex)) {
    for (const name of match[1].split(',')) {
      const original = name.trim().split(/\s+as\s+/)[0];
      if (original) imports.push(original);
    }
  }

  return imports;
}
