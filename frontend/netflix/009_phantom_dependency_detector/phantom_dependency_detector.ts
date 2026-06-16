import { builtinModules } from 'module';

const BUILT_INS = new Set(builtinModules);

/**
 * Scan source code for `require()` / `import` calls, and flag any imported
 * package that is NOT declared in `declared` (the package.json dependencies).
 * Ignore relative imports (those starting with `.` or `/`).
 * Return the de-duplicated, sorted list of phantom package names.
 */
export function findPhantomDeps(source: string, declared: string[]): string[] {
  const declaredSet = new Set(declared);
  const imports = extractImports(source);
  const phantoms = new Set<string>();

  for (const raw of imports) {
    if (raw.startsWith('.') || raw.startsWith('/')) continue;

    const pkgName = getPackageName(raw);

    if (isBuiltin(pkgName)) continue;

    if (!declaredSet.has(pkgName)) {
      phantoms.add(pkgName);
    }
  }

  return Array.from(phantoms).sort();
}

function extractImports(source: string): string[] {
  const result: string[] = [];

  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(source)) !== null) {
    result.push(match[1]);
  }

  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(source)) !== null) {
    result.push(match[1]);
  }

  const sideEffectRegex = /^\s*import\s+['"]([^'"]+)['"]/gm;
  while ((match = sideEffectRegex.exec(source)) !== null) {
    result.push(match[1]);
  }

  return result;
}

function getPackageName(specifier: string): string {
  if (specifier.startsWith('node:')) {
    return specifier.slice(5);
  }

  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    return `${parts[0]}/${parts[1]}`;
  }

  return specifier.split('/')[0];
}

function isBuiltin(name: string): boolean {
  return BUILT_INS.has(name);
}
